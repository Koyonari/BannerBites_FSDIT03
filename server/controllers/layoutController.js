// controllers/layoutController.js
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, TransactWriteCommand} = require("@aws-sdk/lib-dynamodb");
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { generatePresignedUrl } = require("../services/s3Service");
const { dynamoDb } = require("../middleware/awsClients");

MAX_TRANSACTION_OPERATIONS = 25;

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

    if (!layout || !layout.layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    const transactItems = [];
    const uniqueAds = new Set();
    const uniqueGridItems = new Set();

    transactItems.push({
      Put: {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Item: {
          layoutId: layout.layoutId,
          ...layout,
        },
      },
    });

    for (const item of layout.gridItems) {
      console.log(`Processing Grid Item at index ${item.index}`);

      if (item.index === undefined) {
        console.error(`Missing index for grid item at layoutId: ${layout.layoutId}`);
        continue;
      }

      // Ensure only unique grid items are added
      const gridItemKey = `${layout.layoutId}#${item.index}`;
      if (!uniqueGridItems.has(gridItemKey)) {
        transactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
            Item: {
              layoutId: layout.layoutId,
              index: item.index,
              ...item,
            },
          },
        });
        uniqueGridItems.add(gridItemKey);
      }

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

        if (!scheduledAd.id) {
          console.error(`Missing id for scheduled ad at grid item index ${item.index}`);
          continue;
        }

        if (!scheduledAd.gridItemId) {
          scheduledAd.gridItemId = `${layout.layoutId}#${item.index}`;
          console.log(`Assigned gridItemId for scheduled ad: ${scheduledAd.gridItemId}`);
        }

        if (!scheduledAd.scheduledTime) {
          console.error(`Missing scheduledTime for scheduled ad at grid item index ${item.index}`);
          continue;
        }

        transactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              layoutId: layout.layoutId,
              gridItemId: scheduledAd.gridItemId,
              scheduledTime: scheduledAd.scheduledTime,
              ...scheduledAd,
            },
          },
        });

        if (!uniqueAds.has(scheduledAd.ad.adId)) {
          console.log(`Adding Ad with adId ${scheduledAd.ad.adId}`);
          transactItems.push({
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

    if (transactItems.length > 0) {
      // Batch the transaction items to avoid multiple operations on the same item in a single transaction
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

      // Execute each batch sequentially
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

const updateLayout = async (req, res) => {
  console.log("Request to /api/layouts/:layoutId:", JSON.stringify(req.body, null, 2));

  try {
    const { layoutId } = req.params;
    const updatedLayout = req.body;

    if (!updatedLayout || !updatedLayout.layoutId || updatedLayout.layoutId !== layoutId) {
      console.error("Invalid layout data received:", updatedLayout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    // Fetch current grid items and scheduled ads
    const existingGridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    const existingGridItemMap = new Map(existingGridItems.map(item => [item.index, item]));
    const currentScheduledAds = await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);

    // Track scheduled ads to delete
    const adsToDelete = [];

    // Step 1: Clean and validate scheduledAds for uniqueness per grid cell
    const cleanedGridItems = updatedLayout.gridItems.map((item) => {
      const scheduledTimes = new Set();
      item.scheduledAds.forEach((ad) => {
        if (scheduledTimes.has(ad.scheduledTime)) {
          throw new Error(
            `Duplicate scheduledTime "${ad.scheduledTime}" found in grid cell index ${item.index}.`
          );
        }
        scheduledTimes.add(ad.scheduledTime);

        if (!ad.gridItemId) {
          ad.gridItemId = `${layoutId}#${item.index}`;
        }
      });
      return item;
    });

    // Step 2: Compare current scheduled ads with updated scheduled ads to determine deletions
    const updatedScheduledAdsMap = new Map();
    cleanedGridItems.forEach(item => {
      item.scheduledAds.forEach(ad => {
        updatedScheduledAdsMap.set(ad.gridItemId + '#' + ad.scheduledTime, ad);
      });
    });

    currentScheduledAds.forEach(currentAd => {
      const key = currentAd.gridItemId + '#' + currentAd.scheduledTime;
      if (!updatedScheduledAdsMap.has(key)) {
        adsToDelete.push(currentAd);
      }
    });

    const allTransactItems = [];
    const uniqueAds = new Set(); // Track unique adIds

    // Step 3: Update layout attributes
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

    // Step 4: Update grid items and handle scheduled ads
    for (const item of cleanedGridItems) {
      if (existingGridItemMap.has(item.index)) {
        // Fetch the corresponding existing item and compare
        const existingItem = existingGridItemMap.get(item.index);
        if (item.isMerged !== existingItem.isMerged ||
            item.rowSpan !== existingItem.rowSpan ||
            item.colSpan !== existingItem.colSpan ||
            item.hidden !== existingItem.hidden ||
            JSON.stringify(item.selectedCells) !== JSON.stringify(existingItem.selectedCells)) {
          // Add an UpdateCommand to the batch if there are differences
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
        }
      } else {
        // If the grid item does not exist, add a PutCommand
        allTransactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
            Item: {
              layoutId: layoutId,
              index: item.index,
              ...item,
            },
          },
        });
      }

      // Add or update scheduled ads
      for (const scheduledAd of item.scheduledAds) {
        if (scheduledAd === null) {
          continue; // Allow scheduled ads to be null (i.e., skipped during update)
        }

        if (!scheduledAd.gridItemId || !scheduledAd.scheduledTime) {
          console.error("ScheduledAd is missing gridItemId or scheduledTime:", scheduledAd);
          continue;
        }

        allTransactItems.push({
          Put: {
            TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
            Item: {
              gridItemId: scheduledAd.gridItemId,
              scheduledTime: scheduledAd.scheduledTime,
              id: scheduledAd.id,
              ad: scheduledAd.ad ? {
                adId: scheduledAd.ad.adId,
                type: scheduledAd.ad.type,
                content: scheduledAd.ad.content,
                styles: scheduledAd.ad.styles,
              } : null,
              layoutId: layoutId,
              index: item.index,
            },
          },
        });

        if (scheduledAd.ad && !uniqueAds.has(scheduledAd.ad.adId)) {
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

    // Step 5: Handle deletions of removed scheduled ads
    for (const adToDelete of adsToDelete) {
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

    // Step 6: Batch the transaction items into multiple TransactWriteCommands
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

    console.log(`Total Batches: ${batchedTransactItems.length}`);

    // Step 7: Execute each batch sequentially
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
    return res.status(400).json({ message: error.message });
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