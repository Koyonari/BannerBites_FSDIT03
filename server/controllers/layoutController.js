// controllers/layoutController.js
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, TransactWriteCommand} = require("@aws-sdk/lib-dynamodb");
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { generatePresignedUrl } = require("../services/s3Service");
const { dynamoDb } = require("../middleware/awsClients");
const MAX_TRANSACTION_OPERATIONS = 25;

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

// Layout update with transactions
const updateLayout = async (req, res) => {
  console.log("Request to /api/layouts/:layoutId:", JSON.stringify(req.body, null, 2));

  try {
    const { layoutId } = req.params;
    const updatedLayout = req.body;

    // Validate layout data
    if (!updatedLayout || !updatedLayout.layoutId || updatedLayout.layoutId !== layoutId) {
      console.error("Invalid layout data received:", updatedLayout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    // Step 1: Fetch existing scheduled ads
    const existingGridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    const existingScheduledAds = existingGridItems.flatMap(item =>
      item.scheduledAds.map(ad => ({
        ...ad,
        gridItemId: `${layoutId}#${item.index}`,
        scheduledTime: ad.scheduledTime,
      }))
    );

    // Step 2: Prepare updated scheduled ads from the request with gridItemId assigned
    const updatedScheduledAds = updatedLayout.gridItems.flatMap(item =>
      item.scheduledAds.map(ad => ({
        ...ad,
        gridItemId: `${layoutId}#${item.index}`, // Assign gridItemId based on layoutId and gridItem index
        scheduledTime: ad.scheduledTime, // Ensure scheduledTime is present
      }))
    );

    // Step 3: Identify scheduled ads to delete
    const adsToDelete = existingScheduledAds.filter(existingAd => {
      return !updatedScheduledAds.some(updatedAd => 
        updatedAd.gridItemId === existingAd.gridItemId &&
        updatedAd.scheduledTime === existingAd.scheduledTime
      );
    });

    // Step 4: Identify scheduled ads to add or update
    const adsToAddOrUpdate = updatedScheduledAds;

    const allTransactItems = [];
    const uniqueAds = new Set(); // Track unique adIds

    // Update layout attributes
    allTransactItems.push({
      Update: {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Key: { layoutId },
        UpdateExpression: "set #name = :name, updatedAt = :updatedAt, #rows = :rows, #columns = :columns",
        ExpressionAttributeNames: {
          "#name": "name",
          "#rows": "rows",
          "#columns": "columns",
        },
        ExpressionAttributeValues: {
          ":name": updatedLayout.name,
          ":updatedAt": new Date().toISOString(),
          ":rows": updatedLayout.rows,
          ":columns": updatedLayout.columns,
        },
      },
    });

    // Update grid items and handle scheduled ads
    for (const item of updatedLayout.gridItems) {
      // Only process non-hidden grid items
      if (item.hidden === true) continue;

      // Update grid item
      allTransactItems.push({
        Update: {
          TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
          Key: { layoutId, index: item.index },
          UpdateExpression: "set #colSpan = :colSpan, #rowSpan = :rowSpan, #isMerged = :isMerged, #hidden = :hidden, #mergeDirection = :mergeDirection, #selectedCells = :selectedCells",
          ExpressionAttributeNames: {
            "#colSpan": "colSpan",
            "#rowSpan": "rowSpan",
            "#isMerged": "isMerged",
            "#hidden": "hidden",
            "#mergeDirection": "mergeDirection",
            "#selectedCells": "selectedCells",
          },
          ExpressionAttributeValues: {
            ":colSpan": item.colSpan,
            ":rowSpan": item.rowSpan,
            ":isMerged": item.isMerged,
            ":hidden": item.hidden,
            ":mergeDirection": item.mergeDirection,
            ":selectedCells": item.selectedCells,
          },
        },
      });

      // Handle scheduled ads within grid items
      for (const scheduledAd of item.scheduledAds) {
        // Validation: Ensure gridItemId and scheduledTime are present
        if (!scheduledAd.gridItemId || !scheduledAd.scheduledTime) {
          console.error("ScheduledAd is missing gridItemId or scheduledTime:", scheduledAd);
          return res.status(400).json({ message: "ScheduledAd is missing gridItemId or scheduledTime." });
        }

        // Avoid duplicate Put operations for the same (gridItemId, scheduledTime)
        const scheduledAdKey = `${scheduledAd.gridItemId}#${scheduledAd.scheduledTime}`;
        if (allTransactItems.some(item => {
          if (item.Put && item.Put.TableName === process.env.DYNAMODB_TABLE_SCHEDULEDADS) {
            const existingItem = item.Put.Item;
            return `${existingItem.gridItemId}#${existingItem.scheduledTime}` === scheduledAdKey;
          }
          return false;
        })) {
          console.warn(`Duplicate ScheduledAd detected for ${scheduledAdKey}. Skipping.`);
          continue; // Skip duplicate
        }

        // Add or update scheduled ad
        allTransactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              gridItemId: scheduledAd.gridItemId, // Composite Partition Key
              scheduledTime: scheduledAd.scheduledTime, // Composite Sort Key
              id: scheduledAd.id, // Unique Identifier (attribute)
              ad: {
                adId: scheduledAd.ad.adId,
                type: scheduledAd.ad.type,
                content: scheduledAd.ad.content,
                styles: scheduledAd.ad.styles,
              },
              layoutId: layoutId,
              index: item.index, // Reference to gridItem index
            },
          },
        });

        // Add or update the Ad in Ads table only if it's not already processed
        if (!uniqueAds.has(scheduledAd.ad.adId)) {
          allTransactItems.push({
            Put: {
              TableName: process.env.DYNAMODB_TABLE_ADS,
              Item: {
                adId: scheduledAd.ad.adId,
                ...scheduledAd.ad,
              },
            },
          });
          uniqueAds.add(scheduledAd.ad.adId);
        }
      }
    }

    // Handle deletions
    for (const adToDelete of adsToDelete) {
      // Validation: Ensure gridItemId and scheduledTime are present
      if (!adToDelete.gridItemId || !adToDelete.scheduledTime) {
        console.error("Ad to delete is missing gridItemId or scheduledTime:", adToDelete);
        return res.status(400).json({ message: "Ad to delete is missing gridItemId or scheduledTime." });
      }

      allTransactItems.push({
        Delete: {
          TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
          Key: {
            gridItemId: adToDelete.gridItemId,
            scheduledTime: adToDelete.scheduledTime,
          },
        },
      });
    }

    // **Debugging Step**: Log allTransactItems to identify duplicates or missing keys
    console.log("All Transaction Items: ", JSON.stringify(allTransactItems, null, 2));

    // Step 5: Batch the transaction items into multiple TransactWriteCommands
    const batchedTransactItems = [];
    let currentBatch = [];

    for (const transactItem of allTransactItems) {
      if (currentBatch.length >= MAX_TRANSACTION_OPERATIONS) {
        batchedTransactItems.push([...currentBatch]);
        currentBatch = [];
      }
      currentBatch.push(transactItem);
    }

    if (currentBatch.length > 0) {
      batchedTransactItems.push([...currentBatch]);
    }

    // **Debugging Step**: Log the number of batches
    console.log(`Total Batches: ${batchedTransactItems.length}`);

    // Step 6: Execute each batch sequentially
    for (let i = 0; i < batchedTransactItems.length; i++) {
      const batch = batchedTransactItems[i];
      console.log(`Executing Batch ${i + 1} with ${batch.length} operations.`);

      const transactionCommand = new TransactWriteCommand({
        TransactItems: batch,
      });

      try {
        await dynamoDb.send(transactionCommand);
        console.log(`Batch ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing Batch ${i + 1}:`, error);
        return res.status(500).json({ message: `Failed to execute batch ${i + 1}.` });
      }
    }

    console.log(`All batches executed successfully for layout ${layoutId}.`);
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
    console.log(`Fetching layout details for layoutId: ${layoutId}`);
    const layout = await LayoutModel.getLayoutById(layoutId);

    if (!layout) {
      console.error(`Layout not found for layoutId: ${layoutId}`);
      return null;
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

      const gridItemId = `${layoutId}#${item.index}`;
      console.log(`Using gridItemId for GetCommand in ScheduledAds table: ${gridItemId}`);

      const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(gridItemId);

      for (const scheduledAd of scheduledAds) {
        // Correctly access adId from the nested ad object
        const adId = scheduledAd.ad?.adId;
        if (!adId) {
          console.error(`ScheduledAd is missing adId for scheduledAd ID: ${scheduledAd.id}`);
          continue; // Skip fetching ad details if adId is missing
        }

        console.log(`Fetching Ad details for adId: ${adId}`);

        try {
          const ad = await AdModel.getAdById(adId);
          if (!ad) {
            console.error(`Ad not found for adId: ${adId}`);
          } else {
            scheduledAd.ad = ad;
          }
        } catch (error) {
          console.error(`Error fetching Ad for adId: ${adId}`, error);
        }
      }

      item.scheduledAds = scheduledAds;
    }

    layout.gridItems = gridItems;
    return layout; // Return the layout object
  } catch (error) {
    console.error(`Error fetching layout data for layoutId: ${layoutId}`, error);
    throw error;
  }
};

const deleteLayout = async (req, res) => {
  try {
    const { layoutId } = req.params;

    // Step 1: Fetch related grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    if (!gridItems || gridItems.length === 0) {
      throw new Error(`No grid items found for layoutId: ${layoutId}`);
    }

    // Step 2: Fetch related scheduled ads
    const scheduledAds = await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);
    if (!scheduledAds || scheduledAds.length === 0) {
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
    const adIdsToDelete = new Set(scheduledAds.map((ad) => ad.adId).filter(Boolean));

    for (const adId of adIdsToDelete) {
      if (!adId) {
        console.warn("Encountered scheduledAd with undefined adId. Skipping.");
        continue;
      }
      console.log(`Checking if Ad ${adId} can be deleted.`);
      try {
        // Check if the ad is scheduled anywhere else
        const associatedScheduledAds = await ScheduledAdModel.getScheduledAdsByAdId(adId);
        if (!associatedScheduledAds || associatedScheduledAds.length === 0) {
          // Only delete if no other layouts are using this ad
          await AdModel.deleteAdById(adId); // Correct method name
          console.log(`Ad ${adId} deleted successfully.`);
        }
      } catch (error) {
        console.error(`Error processing Ad ${adId}:`, error);
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