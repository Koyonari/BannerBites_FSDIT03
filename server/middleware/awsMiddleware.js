const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const dotenv = require("dotenv");
const { clients, layoutUpdatesCache } = require("../state");

dotenv.config();

// Initialize AWS Clients
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

const dynamoDbStreamsClient = new DynamoDBStreamsClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log("[BACKEND] AWS Clients initialized in awsMiddleware");

// Function to set up DynamoDB Stream listener
const listenToDynamoDbStreams = async (clients, layoutUpdatesCache) => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_LAYOUTS,
    process.env.DYNAMODB_TABLE_GRIDITEMS,
    process.env.DYNAMODB_TABLE_SCHEDULEDADS,
    process.env.DYNAMODB_TABLE_ADS,
  ];

  for (const tableName of tableNames) {
    const params = { TableName: tableName };

    try {
      const describeTableCommand = new DescribeTableCommand(params);
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`[BACKEND] Stream is not enabled for table ${tableName}`);
        continue;
      }

      console.log(`[BACKEND] Listening to DynamoDB Stream for table ${tableName}: ${streamArn}`);

      const describeStreamParams = { StreamArn: streamArn, Limit: 10 };
      const describeStreamCommand = new DescribeStreamCommand(describeStreamParams);
      const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);

      if (!streamData.StreamDescription.Shards || streamData.StreamDescription.Shards.length === 0) {
        console.warn(`[BACKEND] No shards available in the stream for table ${tableName}.`);
        continue;
      }

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
            let itemId;
            let layoutId = updatedItem.layoutId; // May be undefined for Ads
            const affectedLayoutIds = new Set(); // To keep track of layouts to update

            switch (tableName) {
              case process.env.DYNAMODB_TABLE_LAYOUTS:
                itemId = layoutId;
                // Update the layout properties in the cache
                if (layoutUpdatesCache[layoutId]) {
                  Object.assign(layoutUpdatesCache[layoutId], updatedItem);
                  console.log(`[BACKEND] Updated layout in cache for layoutId: ${layoutId}`);
                } else {
                  // If not in cache, initialize it
                  layoutUpdatesCache[layoutId] = updatedItem;
                  console.log(`[BACKEND] Initialized layout in cache for layoutId: ${layoutId}`);
                }
                affectedLayoutIds.add(layoutId);
                break;

              case process.env.DYNAMODB_TABLE_GRIDITEMS:
                itemId = layoutId;
                // Update or add the grid item in the cached layout
                if (layoutUpdatesCache[layoutId]) {
                  const gridItems = layoutUpdatesCache[layoutId].gridItems || [];
                  const index = gridItems.findIndex(item => item.index === updatedItem.index);
                  if (index !== -1) {
                    gridItems[index] = updatedItem;
                    console.log(`[BACKEND] Updated grid item in cache for layoutId: ${layoutId}, index: ${updatedItem.index}`);
                  } else {
                    gridItems.push(updatedItem);
                    console.log(`[BACKEND] Added new grid item to cache for layoutId: ${layoutId}, index: ${updatedItem.index}`);
                  }
                  layoutUpdatesCache[layoutId].gridItems = gridItems;
                  affectedLayoutIds.add(layoutId);
                }
                break;

              case process.env.DYNAMODB_TABLE_SCHEDULEDADS:
                itemId = layoutId;
                // Update or add the scheduled ad in the cached layout
                if (layoutUpdatesCache[layoutId]) {
                  const gridItems = layoutUpdatesCache[layoutId].gridItems || [];
                  const gridItemIndex = updatedItem.index;
                  const gridItem = gridItems.find(item => item.index === gridItemIndex);
                  if (gridItem) {
                    const scheduledAds = gridItem.scheduledAds || [];
                    const adIndex = scheduledAds.findIndex(ad => ad.id === updatedItem.id);
                    if (adIndex !== -1) {
                      scheduledAds[adIndex] = updatedItem;
                      console.log(`[BACKEND] Updated scheduled ad in cache for layoutId: ${layoutId}, gridItem index: ${gridItemIndex}`);
                    } else {
                      scheduledAds.push(updatedItem);
                      console.log(`[BACKEND] Added new scheduled ad to cache for layoutId: ${layoutId}, gridItem index: ${gridItemIndex}`);
                    }
                    gridItem.scheduledAds = scheduledAds;
                    affectedLayoutIds.add(layoutId);
                  }
                }
                break;

              case process.env.DYNAMODB_TABLE_ADS:
                // Update the ad details in all relevant scheduled ads
                const adId = updatedItem.adId || updatedItem.id; // Use 'id' if 'adId' is not present
                console.log(`[BACKEND] Updating ad in cache for adId: ${adId}`);
                for (const layout of Object.values(layoutUpdatesCache)) {
                  const gridItems = layout.gridItems || [];
                  let layoutAffected = false;
                  for (const gridItem of gridItems) {
                    const scheduledAds = gridItem.scheduledAds || [];
                    for (const scheduledAd of scheduledAds) {
                      if (scheduledAd.ad && scheduledAd.ad.id === adId) {
                        scheduledAd.ad = updatedItem;
                        console.log(`[BACKEND] Updated ad in cache for layoutId: ${layout.layoutId}, gridItem index: ${gridItem.index}`);
                        affectedLayoutIds.add(layout.layoutId);
                        layoutAffected = true;
                      }
                    }
                  }
                  if (layoutAffected) {
                    layoutUpdatesCache[layout.layoutId].gridItems = gridItems;
                  }
                }
                break;

              default:
                console.warn(`[BACKEND] Unknown table: ${tableName}`);
            }

            // Send updated layouts to clients interested in these layoutIds
            for (const layoutId of affectedLayoutIds) {
              if (clients && clients.length > 0) {
                const updatedLayout = layoutUpdatesCache[layoutId];
                if (updatedLayout) {
                  clients.forEach((client) => {
                    if (client.layoutId === layoutId) {
                      client.res.write(`data: ${JSON.stringify({ type: "layoutUpdate", data: updatedLayout })}\n\n`);
                      console.log(`[BACKEND] Sent layoutUpdate to client ${client.id} for layoutId: ${layoutId}`);
                    }
                  });
                } else {
                  console.warn(`[BACKEND] No cached layout found for layoutId: ${layoutId}`);
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

module.exports = { dynamoDb, dynamoDbClient, s3Client, listenToDynamoDbStreams };
