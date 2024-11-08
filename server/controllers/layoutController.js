// controllers/layoutController.js
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, TransactWriteCommand} = require("@aws-sdk/lib-dynamodb");
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { generatePresignedUrl } = require("../services/s3Service");
const { dynamoDb } = require("../middleware/awsClients");

const generatePresignedUrlController = async (req, res) => {
  const { fileName, contentType } = req.body;

  // Determine the folder based on content type
  let folder;
  if (contentType.startsWith("image/")) {
    folder = "images";
  } else if (contentType.startsWith("video/")) {
    folder = "videos";
  } else {
    return res.status(400).json({ error: "Unsupported content type" });
  }

  // Generate the S3 key
  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
    const url = await generatePresignedUrl(
      process.env.S3_BUCKET_NAME,
      key,
      contentType,
      300
    );
    res.json({ url, key });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: error.message });
  }
};

// Updated saveLayout without transactions
const saveLayout = async (req, res) => {
  console.log(
    "Request to /api/layouts/save:",
    JSON.stringify(req.body, null, 2),
  );

  try {
    const layout = req.body;

    // Validate layout data
    if (!layout || !layout.layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    const transactItems = [];
    const uniqueAds = new Set();

    // Step 1: Add the Layout (Ensure keys match the table schema)
    transactItems.push({
      Put: {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Item: {
          layoutId: layout.layoutId, // Assuming layoutId is the partition key
          ...layout,
        },
      },
    });

    // Step 2: Add Grid Items and Scheduled Ads
    for (const item of layout.gridItems) {
      console.log(`Processing Grid Item at index ${item.index}`);

      // Ensure that gridItem key is defined properly
      if (item.index === undefined) {
        console.error(`Missing index for grid item at layoutId: ${layout.layoutId}`);
        continue;
      }

      // Add Grid Item
      transactItems.push({
        Put: {
          TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
          Item: {
            layoutId: layout.layoutId, // Assuming layoutId is the partition key
            index: item.index,         // Assuming index is the sort key
            ...item,
          },
        },
      });

      // Add Scheduled Ads
      for (const scheduledAd of item.scheduledAds) {
        if (!scheduledAd.ad || !scheduledAd.ad.adId) {
          console.error(
            `Missing adId for scheduled ad at grid item index ${item.index}`,
          );
          continue;
        }

        console.log(
          `Adding Scheduled Ad with id ${scheduledAd.id} and adId ${scheduledAd.ad.adId}`,
        );

        // Ensure scheduledAd key is defined properly
        if (!scheduledAd.id) {
          console.error(`Missing id for scheduled ad at grid item index ${item.index}`);
          continue;
        }

        transactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              layoutId: layout.layoutId,           // Assuming layoutId is part of the key
              gridItemId: `${layout.layoutId}#${item.index}`, // Assuming this is the partition key or composite key
              scheduledTime: scheduledAd.scheduledTime, // Assuming this is a necessary attribute
              ...scheduledAd,
            },
          },
        });

        // Add Ad if not already added (Ensure the keys are properly set)
        if (!uniqueAds.has(scheduledAd.ad.adId)) {
          console.log(`Adding Ad with adId ${scheduledAd.ad.adId}`);
          transactItems.push({
            Put: {
              TableName: process.env.DYNAMODB_TABLE_ADS,
              Item: {
                adId: scheduledAd.ad.adId, // Assuming adId is the partition key
                ...scheduledAd.ad,
              },
            },
          });
          uniqueAds.add(scheduledAd.ad.adId);
        }
      }
    }

    // Step 3: Execute Transaction
    if (transactItems.length > 0) {
      const transactionCommand = new TransactWriteCommand({
        TransactItems: transactItems,
      });

      await dynamoDb.send(transactionCommand);

      console.log(
        `Layout ${layout.layoutId} and related items saved successfully.`,
      );
      return res
        .status(201)
        .json({ message: "Layout and related items saved successfully." });
    } else {
      console.error("No valid transaction items to execute.");
      return res.status(400).json({ message: "No valid items to save." });
    }
  } catch (error) {
    console.error("Error saving layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Updated updateLayout without transactions
const updateLayout = async (req, res) => {
  console.log("Request to /api/layouts/:layoutId:", JSON.stringify(req.body, null, 2));

  try {
    const { layoutId } = req.params;
    const layout = req.body;

    if (!layout || !layout.layoutId || layout.layoutId !== layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    // Update layout details
    await LayoutModel.updateLayout(layout);
    console.log(`Layout ${layout.layoutId} updated successfully.`);

    // Delete old Scheduled Ads that are no longer present
    await ScheduledAdModel.deleteOldScheduledAds(layoutId, layout);

    // Track unique ads to prevent duplicate saves
    const uniqueAds = new Set();

    // Save grid items and scheduled ads
    for (const item of layout.gridItems) {
      console.log(`Processing Grid Item at index ${item.index}`);
      // Save or update grid item
      await GridItemModel.updateGridItem(layout.layoutId, item.index, item);
      console.log(`Grid item at index ${item.index} updated successfully.`);

      // Save scheduled ads
      for (const scheduledAd of item.scheduledAds) {
        if (!scheduledAd.ad || !scheduledAd.ad.adId) { // Use ad.adId
          console.error(`Missing adId for scheduled ad at grid item index ${item.index}`);
          continue;
        }

        console.log(`Saving Scheduled Ad with id ${scheduledAd.id} and adId ${scheduledAd.ad.adId}`);
        // Save scheduled ad
        await ScheduledAdModel.saveScheduledAd(layout.layoutId, item.index, scheduledAd);
        console.log(`Scheduled ad ${scheduledAd.ad.adId} saved successfully.`);

        // Save ad if not already saved
        if (!uniqueAds.has(scheduledAd.ad.adId)) {
          console.log(`Saving Ad with adId ${scheduledAd.ad.adId}`);
          await AdModel.saveAd(scheduledAd.ad);
          console.log(`Ad ${scheduledAd.ad.adId} saved successfully.`);
          uniqueAds.add(scheduledAd.ad.adId);
        }
      }
    }

    return res.status(200).json({ message: "Layout and related items updated successfully." });
  } catch (error) {
    console.error("Error updating layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// Ensure getAllLayouts is included
const getAllLayouts = async (req, res) => {
  try {
    const layouts = await LayoutModel.getAllLayouts();
    res.json(layouts);
  } catch (error) {
    console.error("Error fetching layouts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch Layout By ID remains unchanged but ensure ad.adId is used
const getLayoutById = async (req, res) => {
  const { layoutId } = req.params;

  try {
    const layout = await fetchLayoutById(layoutId);

    if (!layout) {
      return res.status(404).json({ message: "Layout not found." });
    }

    res.json(layout);
  } catch (error) {
    console.error("Error fetching layout data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const fetchLayoutById = async (layoutId) => {
  try {
    // Step 1: Get layout details
    console.log(`Fetching layout details for layoutId: ${layoutId}`);
    const layout = await LayoutModel.getLayoutById(layoutId);

    if (!layout) {
      console.error(`Layout not found for layoutId: ${layoutId}`);
      return null; // Layout not found
    }

    console.log(`Fetched layout: ${JSON.stringify(layout)}`);

    // Step 2: Get grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    if (!gridItems || gridItems.length === 0) {
      console.error(`No grid items found for layoutId: ${layoutId}`);
    }

    // Step 3: Get scheduled ads and ad details
    for (const item of gridItems) {
      console.log(`Fetching scheduled ads for grid item index: ${item.index}`);

      const gridItemId = `${layoutId}#${item.index}`; // Ensure this matches schema
      console.log(`Using gridItemId for GetCommand in ScheduledAds table: ${gridItemId}`);

      const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(gridItemId);

      for (const scheduledAd of scheduledAds) {
        console.log(`Fetching Ad details for adId: ${scheduledAd.adId}`);
        
        try {
          const ad = await AdModel.getAdById(scheduledAd.adId);
          if (!ad) {
            console.error(`Ad not found for adId: ${scheduledAd.adId}`);
          } else {
            scheduledAd.ad = ad;
          }
        } catch (error) {
          console.error(`Error fetching Ad for adId: ${scheduledAd.adId}`, error);
        }
      }

      item.scheduledAds = scheduledAds;
    }

    layout.gridItems = gridItems;
    return layout; // Return the layout object
  } catch (error) {
    console.error(`Error fetching layout data for layoutId: ${layoutId}`, error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

const deleteLayout = async (req, res) => {
  try {
    const { layoutId } = req.params;

    // Step 1: Fetch related grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    if (!gridItems) {
      throw new Error(`No grid items found for layoutId: ${layoutId}`);
    }

    // Step 2: Fetch related scheduled ads
    const scheduledAds = await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);
    if (!scheduledAds) {
      throw new Error(`No scheduled ads found for layoutId: ${layoutId}`);
    }

    // Step 3: Prepare delete operations for grid items and scheduled ads
    const transactItems = [];

    // Add delete operations for grid items
    gridItems.forEach((gridItem) => {
      if (gridItem.layoutId && gridItem.index !== undefined) {
        transactItems.push({
          Delete: {
            TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
            Key: {
              layoutId: gridItem.layoutId,
              index: gridItem.index,
            },
          },
        });
      } else {
        console.error("Invalid grid item key:", gridItem);
      }
    });

    // Add delete operations for scheduled ads
    scheduledAds.forEach((scheduledAd) => {
      if (scheduledAd.gridItemId && scheduledAd.scheduledTime) {
        transactItems.push({
          Delete: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Key: {
              gridItemId: scheduledAd.gridItemId,
              scheduledTime: scheduledAd.scheduledTime,
            },
          },
        });
      } else {
        console.error("Invalid scheduled ad key:", scheduledAd);
      }
    });

    // Add delete operation for layout
    if (layoutId) {
      transactItems.push({
        Delete: {
          TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
          Key: {
            layoutId: layoutId,
          },
        },
      });
    } else {
      console.error("Invalid layoutId:", layoutId);
    }

    // Log transaction items for debugging purposes
    console.log("Transaction Delete Items: ", JSON.stringify(transactItems, null, 2));

    // Step 4: Execute the transaction if all delete operations are valid
    if (transactItems.length > 0) {
      const transactionCommand = new TransactWriteCommand({
        TransactItems: transactItems,
      });
      await dynamoDb.send(transactionCommand);
    } else {
      throw new Error("No valid transaction items to execute.");
    }

    // Step 5: Check for any Ads that are no longer referenced and delete them if needed
    const adIdsToDelete = new Set(scheduledAds.map((ad) => ad.adId));
    for (const adId of adIdsToDelete) {
      // Check if the ad is scheduled anywhere else
      const associatedScheduledAds = await ScheduledAdModel.getScheduledAdsByAdId(adId);
      if (associatedScheduledAds.length === 0) {
        // Only delete if no other layouts are using this ad
        await AdModel.deleteAd(adId);
        console.log(`Ad ${adId} deleted successfully.`);
      }
    }

    return res.status(200).json({ message: `Layout ${layoutId} and its related items deleted successfully.` });
  } catch (error) {
    console.error("Error deleting layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


module.exports = {
  generatePresignedUrlController,
  saveLayout,
  updateLayout,
  getAllLayouts,
  getLayoutById,
  fetchLayoutById,
  deleteLayout,
};