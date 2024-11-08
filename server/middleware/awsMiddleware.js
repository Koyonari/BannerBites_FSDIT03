// middleware/awsMiddleware.js

const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const dotenv = require("dotenv");
const { clients, layoutUpdatesCache } = require("../state");
const { dynamoDbClient, dynamoDbStreamsClient } = require("./awsClients"); // Correct import path
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");

dotenv.config();

// Helper Function: Fetch Full Layout Data
const fetchLayoutById = async (layoutId) => {
  try {
    // Step 1: Get layout details
    const layout = await LayoutModel.getLayoutById(layoutId);

    if (!layout) {
      return null; // Layout not found
    }

    // Step 2: Get grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);

    // Step 3: Get scheduled ads and ad details
    for (const gridItem of gridItems) {
      const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(
        `${layoutId}#${gridItem.index}`
      );

      for (const scheduledAd of scheduledAds) {
        const ad = await AdModel.getAdById(scheduledAd.adId);
        scheduledAd.ad = ad;
      }

      gridItem.scheduledAds = scheduledAds;
    }

    layout.gridItems = gridItems;
    return layout; // Return the complete layout object
  } catch (error) {
    console.error("Error fetching layout data:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

// Function to set up DynamoDB Stream listener
const listenToDynamoDbStreams = async () => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_LAYOUTS,
    process.env.DYNAMODB_TABLE_GRIDITEMS,
    process.env.DYNAMODB_TABLE_SCHEDULEDADS,
    process.env.DYNAMODB_TABLE_ADS,
  ];

  for (const tableName of tableNames) {
    const params = { TableName: tableName };

    try {
      // Describe the table to get the latest Stream ARN
      const describeTableCommand = new DescribeTableCommand(params);
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`[BACKEND] Stream is not enabled for table ${tableName}`);
        continue;
      }

      console.log(`[BACKEND] Listening to DynamoDB Stream for table ${tableName}: ${streamArn}`);

      // Describe the Stream to get shard information
      const describeStreamParams = { StreamArn: streamArn, Limit: 10 };
      const describeStreamCommand = new DescribeStreamCommand(describeStreamParams);
      const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);

      if (!streamData.StreamDescription.Shards || streamData.StreamDescription.Shards.length === 0) {
        console.warn(`[BACKEND] No shards available in the stream for table ${tableName}.`);
        continue;
      }

      // Iterate through each shard and start polling
      for (const shard of streamData.StreamDescription.Shards) {
        const getShardIteratorParams = {
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST",
        };

        const shardIteratorCommand = new GetShardIteratorCommand(getShardIteratorParams);
        const shardIteratorResponse = await dynamoDbStreamsClient.send(shardIteratorCommand);
        let shardIterator = shardIteratorResponse.ShardIterator;

        if (shardIterator) {
          pollStream(shardIterator, tableName);
        }
      }
    } catch (error) {
      console.error(`[BACKEND] Error setting up DynamoDB Streams listener for table ${tableName}:`, error);
    }
  }
};

// Function to poll a shard for records
const pollStream = async (shardIterator, tableName) => {
  while (shardIterator) {
    try {
      const getRecordsCommand = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
      });

      const recordsData = await dynamoDbStreamsClient.send(getRecordsCommand);
      const records = recordsData.Records;

      if (records && records.length > 0) {
        for (const record of records) {
          if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
            const updatedItem = unmarshall(record.dynamodb.NewImage);
            let layoutId = updatedItem.layoutId; // May be undefined for Ads
            const affectedLayoutIds = new Set(); // To keep track of layouts to update

            switch (tableName) {
              case process.env.DYNAMODB_TABLE_LAYOUTS:
                console.log(`[BACKEND] Updated item in Layouts table:`, updatedItem);

                // Fetch the full layout data to ensure cache has complete information
                try {
                  const fullLayout = await fetchLayoutById(layoutId);
                  if (fullLayout) {
                    layoutUpdatesCache[layoutId] = fullLayout;
                    console.log(`[BACKEND] Cached full layout for layoutId: ${layoutId}`);
                  } else {
                    console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
                  }
                  affectedLayoutIds.add(layoutId);
                } catch (error) {
                  console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
                }
                break;

              case process.env.DYNAMODB_TABLE_GRIDITEMS:
                console.log(`[BACKEND] Updated item in GridItems table:`, updatedItem);

                // Fetch the full layout data to ensure cache is up-to-date
                try {
                  const fullLayout = await fetchLayoutById(layoutId);
                  if (fullLayout) {
                    layoutUpdatesCache[layoutId] = fullLayout;
                    console.log(`[BACKEND] Cached full layout for layoutId: ${layoutId}`);
                  } else {
                    console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
                  }
                  affectedLayoutIds.add(layoutId);
                } catch (error) {
                  console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
                }
                break;

              case process.env.DYNAMODB_TABLE_SCHEDULEDADS:
                console.log(`[BACKEND] Updated item in ScheduledAds table:`, updatedItem);

                // Fetch the full layout data to ensure cache is up-to-date
                try {
                  const fullLayout = await fetchLayoutById(layoutId);
                  if (fullLayout) {
                    layoutUpdatesCache[layoutId] = fullLayout;
                    console.log(`[BACKEND] Cached full layout for layoutId: ${layoutId}`);
                  } else {
                    console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
                  }
                  affectedLayoutIds.add(layoutId);
                } catch (error) {
                  console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
                }
                break;

              case process.env.DYNAMODB_TABLE_ADS:
                const adId = updatedItem.adId || updatedItem.id; // Use 'adId', fallback to 'id'
                console.log(`[BACKEND] Updating ad in cache for adId: ${adId}`);

                // Update the ad details in all relevant scheduled ads
                for (const cachedLayoutId in layoutUpdatesCache) {
                  const layout = layoutUpdatesCache[cachedLayoutId];
                  const gridItems = layout.gridItems || [];
                  let layoutAffected = false;

                  for (const gridItem of gridItems) {
                    const scheduledAds = gridItem.scheduledAds || [];
                    for (const scheduledAd of scheduledAds) {
                      if (scheduledAd.ad && scheduledAd.ad.id === adId) {
                        scheduledAd.ad = updatedItem;
                        console.log(`[BACKEND] Updated ad in cache for layoutId: ${cachedLayoutId}, gridItem index: ${gridItem.index}`);
                        layoutAffected = true;
                      }
                    }
                  }

                  if (layoutAffected) {
                    // Update the cache
                    layoutUpdatesCache[cachedLayoutId].gridItems = gridItems;
                    affectedLayoutIds.add(cachedLayoutId);
                  }
                }
                break;

              default:
                console.warn(`[BACKEND] Unknown table: ${tableName}`);
            }

            // Send updated layouts to clients interested in these layoutIds
            for (const affectedLayoutId of affectedLayoutIds) {
              if (clients && clients.length > 0) {
                const updatedLayout = layoutUpdatesCache[affectedLayoutId];
                if (updatedLayout) {
                  clients.forEach((client) => {
                    if (client.layoutId === affectedLayoutId) {
                      const updatedLayoutCopy = JSON.parse(JSON.stringify(updatedLayout));
                      client.res.write(`data: ${JSON.stringify({ type: "layoutUpdate", data: updatedLayoutCopy })}\n\n`);
                      console.log(`[BACKEND] Sent layoutUpdate to client ${client.id} for layoutId: ${affectedLayoutId}`);
                    }
                  });
                } else {
                  console.warn(`[BACKEND] No cached layout found for layoutId: ${affectedLayoutId}`);
                }
              } else {
                console.warn("[BACKEND] No SSE clients connected.");
              }
            }
          }
        }
      }

      shardIterator = recordsData.NextShardIterator;
    } catch (error) {
      console.error(`[BACKEND] Error polling DynamoDB Stream for table ${tableName}:`, error);
      break;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

module.exports = { listenToDynamoDbStreams };
