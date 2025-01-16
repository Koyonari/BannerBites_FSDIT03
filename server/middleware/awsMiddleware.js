// services/dynamoDbStreamListener.js

const {
  DescribeTableCommand,
  DynamoDBClient,
} = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const debounce = require("lodash.debounce");
const { layoutUpdatesCache, clients } = require("../state");
const { fetchLayoutById, getLayoutsByAdId } = require("../services/layoutService");
const WebSocket = require("ws");

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDbStreamsClient = new DynamoDBStreamsClient({ region: process.env.AWS_REGION });

// Broadcast function for sending layout updates to WebSocket clients
const broadcastLayoutUpdate = (layoutId, updatedData) => {
  // Remove closed or invalid WebSocket clients
  clients.forEach((clientData, clientWs) => {
    if (clientWs.readyState !== WebSocket.OPEN) {
      console.log("[BACKEND] Removing client due to closed or invalid WebSocket.");
      clients.delete(clientWs);
    }
  });

  // Log the data being broadcasted
  console.log(
    `[BACKEND] Broadcasting layout update for layoutId: ${layoutId}`,
    JSON.stringify(updatedData, null, 2)
  );

  // Broadcast to valid clients listening to the specified layoutId
  clients.forEach((clientData, clientWs) => {
    if (clientData.layoutId === layoutId && clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(JSON.stringify({ type: "layoutUpdate", data: updatedData }));
        console.log(`[BACKEND] Broadcasted layout update to client for layoutId: ${layoutId}`);
      } catch (error) {
        console.error(`[BACKEND] Error broadcasting to client for layoutId: ${layoutId}`, error);
      }
    }
  });
};

// Debounce the broadcast function to reduce unnecessary broadcasts
const debouncedBroadcastLayoutUpdate = debounce(broadcastLayoutUpdate, 1000); // 1 second debounce

// Set up DynamoDB Stream listeners for specified tables
const listenToDynamoDbStreams = async () => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_LAYOUTS,
    process.env.DYNAMODB_TABLE_GRIDITEMS,
    process.env.DYNAMODB_TABLE_SCHEDULEDADS,
    process.env.DYNAMODB_TABLE_ADS,
  ];

  for (const tableName of tableNames) {
    try {
      if (!tableName) {
        console.error(`[BACKEND] Environment variable for tableName is not set.`);
        continue;
      }

      // Describe the table to get the latest Stream ARN
      const describeTableCommand = new DescribeTableCommand({ TableName: tableName });
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`[BACKEND] Stream is not enabled for table ${tableName}`);
        continue;
      }

      console.log(`[BACKEND] Listening to DynamoDB Stream for table ${tableName}: ${streamArn}`);

      // Describe the Stream to get shard information
      const describeStreamCommand = new DescribeStreamCommand({ StreamArn: streamArn, Limit: 10 });
      const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);
      const shards = streamData.StreamDescription.Shards;

      if (!shards || shards.length === 0) {
        console.warn(`[BACKEND] No shards available in the stream for table ${tableName}.`);
        continue;
      }

      for (const shard of shards) {
        const getShardIteratorCommand = new GetShardIteratorCommand({
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST",
        });
        const shardIteratorResponse = await dynamoDbStreamsClient.send(getShardIteratorCommand);
        let shardIterator = shardIteratorResponse.ShardIterator;

        if (shardIterator) {
          pollStream(shardIterator, tableName);
        }
      }
    } catch (error) {
      console.error(
        `[BACKEND] Error setting up DynamoDB Streams listener for table ${tableName}:`,
        error
      );
    }
  }
};

// Poll a DynamoDB Stream shard for records
const pollStream = async (shardIterator, tableName) => {
  while (shardIterator) {
    try {
      const getRecordsCommand = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
      });
      const recordsData = await dynamoDbStreamsClient.send(getRecordsCommand);
      const records = recordsData.Records;
      const affectedLayoutIds = new Set();

      if (records && records.length > 0) {
        for (const record of records) {
          if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
            const updatedItem = unmarshall(record.dynamodb.NewImage);
            let layoutId;

            switch (tableName) {
              case process.env.DYNAMODB_TABLE_LAYOUTS:
              case process.env.DYNAMODB_TABLE_GRIDITEMS:
                layoutId = updatedItem.layoutId;
                if (layoutId) {
                  affectedLayoutIds.add(layoutId);
                }
                break;

              case process.env.DYNAMODB_TABLE_SCHEDULEDADS:
                layoutId = updatedItem.layoutId;
                if (layoutId) {
                  affectedLayoutIds.add(layoutId);
                }
                break;

              case process.env.DYNAMODB_TABLE_ADS:
                const adId = updatedItem.adId;
                if (adId) {
                  // Fetch related layoutIds from ScheduledAds
                  const relatedLayoutIds = await getLayoutsByAdId(adId);
                  relatedLayoutIds.forEach((id) => affectedLayoutIds.add(id));
                }
                break;

              default:
                console.warn(`[BACKEND] Unknown table: ${tableName}`);
            }
          } else if (record.eventName === "REMOVE") {
            // Handle removal events if necessary
            // For example, if an ad is deleted, you might need to update layouts that used it
          }
        }
      }

      // Fetch, cache, and schedule updates for all affected layouts
      for (const layoutId of affectedLayoutIds) {
        try {
          // Fetch the full layout data with complete ad details
          const fullLayout = await fetchLayoutById(layoutId);
          if (fullLayout) {
            layoutUpdatesCache[layoutId] = fullLayout; // Cache the full layout data
            console.log(`[BACKEND] Cached full layout for layoutId: ${layoutId}`);
            // Schedule the debounced broadcast
            debouncedBroadcastLayoutUpdate(layoutId, fullLayout);
          } else {
            console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
          }
        } catch (error) {
          console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
        }
      }

      // Update shardIterator for the next poll
      shardIterator = recordsData.NextShardIterator;

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`[BACKEND] Error polling DynamoDB Stream for table ${tableName}:`, error);
      break; // Exit the polling loop on error
    }
  }
};

module.exports = { listenToDynamoDbStreams };
