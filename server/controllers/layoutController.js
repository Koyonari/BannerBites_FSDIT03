// controllers/layoutController.js
const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { generatePresignedUrl } = require("../services/s3Service");
const { dynamoDb } = require("../middleware/awsClients");

MAX_TRANSACTION_OPERATIONS = 25;

// Function to generate a pre-signed URL for uploading files to S3
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
      300,
    );
    res.json({ url, key });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: error.message });
  }
};

// Updated saveLayout without transactions
const saveLayout = async (req, res) => {
  console.log("Request to /api/layouts/save:", JSON.stringify(req.body, null, 2));

  try {
    const layout = req.body;
    if (!layout || !layout.layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    const transactItems = [];
    const uniqueAds = new Set();
    const uniqueGridItems = new Set();

    // Add layout to transaction items
    transactItems.push({
      Put: {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Item: {
          layoutId: layout.layoutId,
          name: layout.name,
          rows: layout.rows,
          columns: layout.columns,
        },
      },
    });

    // Process each grid item
    for (const item of layout.gridItems) {
      console.log(`Processing Grid Item at index ${item.index}`);

      const gridItemId = `${layout.layoutId}#${item.index}`;
      item.gridItemId = gridItemId;

      if (!uniqueGridItems.has(gridItemId)) {
        transactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
            Item: {
              layoutId: layout.layoutId,
              index: item.index,
              gridItemId: item.gridItemId,
              rowSpan: item.rowSpan,
              colSpan: item.colSpan,
              hidden: item.hidden,
              isMerged: item.isMerged,
              mergeDirection: item.mergeDirection,
              selectedCells: item.selectedCells,
            },
          },
        });
        uniqueGridItems.add(gridItemId);
      }

      // Process scheduled ads for each grid item
      for (const scheduledAd of item.scheduledAds) {
        // Ensure scheduled ad has an adId
        if (!scheduledAd.adId) {
          console.error(`Missing adId for scheduled ad at grid item index ${item.index}`);
          continue;
        }
        
        // Assign gridItemId to scheduledAd
        scheduledAd.gridItemId = gridItemId;

        // Add scheduled ad to transaction items
        transactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              layoutId: layout.layoutId,
              gridItemId: scheduledAd.gridItemId,
              scheduledTime: scheduledAd.scheduledTime,
              id: scheduledAd.id,
              adId: scheduledAd.adId  // Store adId reference
            },
          },
        });

        // Add ad to Ads table if not already added
        if (!uniqueAds.has(scheduledAd.adId)) {
          console.log(`Adding Ad with adId ${scheduledAd.adId}`);
          transactItems.push({
            Put: {
              TableName: process.env.DYNAMODB_TABLE_ADS,
              Item: {
                adId: scheduledAd.adId,
                ...scheduledAd.ad,  // The full ad object
              },
            },
          });
          uniqueAds.add(scheduledAd.adId);
        }
      }
    }

    // Execute transaction in batches
    await executeTransactItemsInBatches(transactItems, res, layout.layoutId);
  } catch (error) {
    console.error("Error saving layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Execute transaction in batches helper function
const executeTransactItemsInBatches = async (transactItems, res, layoutId) => {
  if (transactItems.length > 0) {
    const batchedTransactItems = [];
    let currentBatch = [];

    for (const transactItem of transactItems) {
      if (currentBatch.length >= MAX_TRANSACTION_OPERATIONS) {
        batchedTransactItems.push([...currentBatch]);
        currentBatch = [];
      }
      currentBatch.push(transactItem);
    }
    if (currentBatch.length > 0) {
      batchedTransactItems.push([...currentBatch]);
    }

    console.log(`Total Batches: ${batchedTransactItems.length}`);

    for (let i = 0; i < batchedTransactItems.length; i++) {
      const batch = batchedTransactItems[i];
      console.log(`Executing Batch ${i + 1} with ${batch.length} operations.`);

      try {
        await dynamoDb.send(new TransactWriteCommand({ TransactItems: batch }));
        console.log(`Batch ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing Batch ${i + 1}:`, error);
        return res.status(500).json({ message: `Failed to execute batch ${i + 1}.` });
      }
    }

    console.log(`Layout ${layoutId} and related items saved successfully.`);
    return res.status(201).json({ message: "Layout and related items saved successfully." });
  } else {
    console.error("No valid transaction items to execute.");
    return res.status(400).json({ message: "No valid items to save." });
  }
};

// Function to update layout and related items
const updateLayout = async (req, res) => {
  console.log("Request to /api/layouts/:layoutId:", JSON.stringify(req.body, null, 2));

  try {
    const { layoutId } = req.params;
    const updatedLayout = req.body;

    if (!updatedLayout || updatedLayout.layoutId !== layoutId) {
      return res.status(400).json({ message: "Invalid layout data." });
    }

    const allTransactItems = [];
    const uniqueAds = new Set();

    // Update layout attributes
    allTransactItems.push({
      Update: {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Key: { layoutId },
        UpdateExpression: "set #name = :name, updatedAt = :updatedAt, #rows = :rows, #columns = :columns",
        ExpressionAttributeNames: { "#name": "name", "#rows": "rows", "#columns": "columns" },
        ExpressionAttributeValues: {
          ":name": updatedLayout.name,
          ":updatedAt": new Date().toISOString(),
          ":rows": updatedLayout.rows,
          ":columns": updatedLayout.columns,
        },
      },
    });

    // Process each grid item and scheduled ads as in saveLayout
    for (const item of updatedLayout.gridItems) {
      const gridItemId = `${layoutId}#${item.index}`;

      allTransactItems.push({
        Put: {
          TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
          Item: {
            layoutId: layoutId,
            index: item.index,
            gridItemId: gridItemId,
            rowSpan: item.rowSpan,
            colSpan: item.colSpan,
            hidden: item.hidden,
            isMerged: item.isMerged,
            mergeDirection: item.mergeDirection,
            selectedCells: item.selectedCells,
          },
        },
      });

      // Process scheduled ads for each grid item
      for (const scheduledAd of item.scheduledAds) {
        if (!scheduledAd.adId) {
          console.error("ScheduledAd is missing adId:", scheduledAd);
          continue;
        }

        // Assign gridItemId to scheduledAd
        scheduledAd.gridItemId = gridItemId;

        // Add or update scheduled ad
        allTransactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              gridItemId: scheduledAd.gridItemId,
              scheduledTime: scheduledAd.scheduledTime,
              id: scheduledAd.id,
              adId: scheduledAd.adId,
              layoutId: layoutId,
              index: item.index,
            },
          },
        });

        // Add or update ad in Ads table if not already processed
        if (!uniqueAds.has(scheduledAd.adId)) {
          allTransactItems.push({
            Put: {
              TableName: process.env.DYNAMODB_TABLE_ADS,
              Item: {
                adId: scheduledAd.adId,
                ...scheduledAd.ad,
              },
            },
          });
          uniqueAds.add(scheduledAd.adId);
        }
      }
    }

    // Delete redundant scheduled ads
    await ScheduledAdModel.deleteOldScheduledAds(layoutId, updatedLayout);

    // Execute the transaction to update layout and add/update ads
    await executeTransactItemsInBatches(allTransactItems, res, layoutId);
  } catch (error) {
    console.error("Error updating layout and related items:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Function to retrieve all layouts
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
  // Fetch layout details
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

// Function to fetch layout details by layoutId
const fetchLayoutById = async (layoutId) => {
  try {
    console.log(`Fetching layout details for layoutId: ${layoutId}`);

    // Step 1: Fetch layout from LayoutModel
    const layout = await LayoutModel.getLayoutById(layoutId);
    if (!layout) {
      console.error(`Layout not found for layoutId: ${layoutId}`);
      return null;
    }
    console.log(`Fetched layout: ${JSON.stringify(layout)}`);

    // Step 2: Fetch all GridItems related to this layout
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    if (!gridItems || gridItems.length === 0) {
      console.error(`No grid items found for layoutId: ${layoutId}`);
    }

    // Step 3: Gather all gridItemIds to fetch related scheduled ads
    const gridItemIds = gridItems.map((item) => item.gridItemId);
    const allScheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemIds(gridItemIds);

    // Step 4: Collect unique adIds from scheduledAds to batch fetch ad details
    const adIdsSet = new Set();
    allScheduledAds.forEach((scheduledAd) => {
      if (scheduledAd.adId) {
        adIdsSet.add(scheduledAd.adId);
      } else {
        console.error(`ScheduledAd is missing adId for scheduledAd ID: ${scheduledAd.id}`);
      }
    });
    const adIds = Array.from(adIdsSet);

    // Step 5: Fetch ads from Ads table
    const ads = await AdModel.getAdsByIds(adIds);
    const adsMap = new Map(ads.map((ad) => [ad.adId, ad]));

    // Step 6: Group scheduledAds by gridItemId
    const scheduledAdsByGridItemId = allScheduledAds.reduce((acc, scheduledAd) => {
      if (!acc[scheduledAd.gridItemId]) {
        acc[scheduledAd.gridItemId] = [];
      }
      // Attach ad details to scheduledAd
      scheduledAd.ad = adsMap.get(scheduledAd.adId) || null;
      acc[scheduledAd.gridItemId].push(scheduledAd);
      return acc;
    }, {});

    // Step 7: Attach scheduledAds to their respective grid items
    gridItems.forEach((item) => {
      item.scheduledAds = scheduledAdsByGridItemId[item.gridItemId] || [];
    });

    // Step 8: Attach grid items back to the layout
    layout.gridItems = gridItems;

    return layout;
  } catch (error) {
    console.error(`Error fetching layout data for layoutId: ${layoutId}`, error);
    throw error;
  }
};

// Function to delete layout and related items
const deleteLayout = async (req, res) => {
  try {
    const { layoutId } = req.params;

    // Step 1: Fetch related grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);

    // Step 2: Fetch related scheduled ads
    const scheduledAds =
      await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);

    // Prepare delete operations for grid items and scheduled ads
    const transactItems = [];

    // Add delete operations for grid items if they exist
    if (gridItems && gridItems.length > 0) {
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
    }

    // Add delete operations for scheduled ads if they exist
    if (scheduledAds && scheduledAds.length > 0) {
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
    }

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
    console.log(
      "Transaction Delete Items: ",
      JSON.stringify(transactItems, null, 2),
    );

    // Execute the transaction if there are valid delete operations
    if (transactItems.length > 0) {
      const transactionCommand = new TransactWriteCommand({
        TransactItems: transactItems,
      });
      await dynamoDb.send(transactionCommand);
    } else {
      console.warn(
        "No valid transaction items to execute. Possibly no related items found.",
      );
    }

    // Step 4: Check for any Ads that are no longer referenced and delete them if needed
    if (scheduledAds && scheduledAds.length > 0) {
      // Get the set of adIds that were referenced in the scheduled ads for this layout
      const adIdsToConsider = new Set(
        scheduledAds.map((ad) => ad.adId).filter(Boolean)
      );
    
      for (const adId of adIdsToConsider) {
        if (!adId) {
          console.warn("Encountered scheduledAd with undefined adId. Skipping.");
          continue;
        }
        console.log(`Checking if Ad ${adId} can be deleted.`);
        try {
          // Retrieve all scheduled ads that reference this adId from the ScheduledAds table
          const associatedScheduledAds = await ScheduledAdModel.getScheduledAdsByAdId(adId);
          
          // Filter out scheduled ads that belong to the layout being deleted
          const externalScheduledAds = associatedScheduledAds.filter(
            (sa) => sa.layoutId !== layoutId
          );
    
          // If there are no scheduled ads from other layouts, delete the ad.
          if (externalScheduledAds.length === 0) {
            await AdModel.deleteAdById(adId);
            console.log(`Ad ${adId} deleted successfully.`);
          } else {
            console.log(
              `Ad ${adId} is still referenced in other layouts. Skipping deletion.`
            );
          }
        } catch (error) {
          console.error(`Error processing Ad ${adId}:`, error);
        }
      }
    }

    return res
      .status(200)
      .json({
        message: `Layout ${layoutId} and its related items deleted successfully.`,
      });
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
