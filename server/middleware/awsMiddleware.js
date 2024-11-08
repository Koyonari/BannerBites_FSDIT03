// middleware/awsMiddleware.js

const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const debounce = require("lodash.debounce");
const { clients, layoutUpdatesCache } = require("../state");
const { dynamoDbClient, dynamoDbStreamsClient } = require("./awsClients");
const { fetchLayoutById, getLayoutsByAdId } = require("../services/layoutService"); // Import from layoutService.js

/**
 * Send a layoutUpdate event to all clients subscribed to the given layoutId.
 * @param {string} layoutId - The ID of the layout to update.
 */
const sendLayoutUpdate = (layoutId) => {
  const updatedLayout = layoutUpdatesCache[layoutId];
  if (updatedLayout && clients.length > 0) {
    clients.forEach((client) => {
      if (client.layoutId === layoutId) {
        const updatedLayoutCopy = JSON.parse(JSON.stringify(updatedLayout));
        client.res.write(`data: ${JSON.stringify({ type: "layoutUpdate", data: updatedLayoutCopy })}\n\n`);
        console.log(`[BACKEND] Sent layoutUpdate to client ${client.id} for layoutId: ${layoutId}`);
      }
    });
  } else {
    console.warn(`[BACKEND] No clients connected for layoutId: ${layoutId} or layout not cached.`);
  }
};

// Debounce the sendLayoutUpdate function to batch rapid updates
const debouncedSendLayoutUpdate = debounce(sendLayoutUpdate, 1000); // 1 second debounce

/**
 * Set up DynamoDB Stream listeners for specified tables.
 */
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

      // Iterate through each shard and start polling
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
      console.error(`[BACKEND] Error setting up DynamoDB Streams listener for table ${tableName}:`, error);
    }
  }
};

/**
 * Poll a DynamoDB Stream shard for records.
 * @param {string} shardIterator - The iterator to start polling from.
 * @param {string} tableName - The name of the table associated with the shard.
 */
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
              case process.env.DYNAMODB_TABLE_SCHEDULEDADS:
                layoutId = updatedItem.layoutId;
                if (layoutId) {
                  affectedLayoutIds.add(layoutId);
                }
                break;

              case process.env.DYNAMODB_TABLE_ADS:
                const adId = updatedItem.adId || updatedItem.id;
                if (adId) {
                  const relatedLayoutIds = await getLayoutsByAdId(adId);
                  relatedLayoutIds.forEach((id) => affectedLayoutIds.add(id));
                }
                break;

              default:
                console.warn(`[BACKEND] Unknown table: ${tableName}`);
            }
          }
        }
      }

      // Fetch, cache, and schedule updates for all affected layouts
      for (const layoutId of affectedLayoutIds) {
        try {
          const fullLayout = await fetchLayoutById(layoutId);
          if (fullLayout) {
            layoutUpdatesCache[layoutId] = fullLayout;
            console.log(`[BACKEND] Cached full layout for layoutId: ${layoutId}`);
            // Schedule the debounced send
            debouncedSendLayoutUpdate(layoutId);
          } else {
            console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
          }
        } catch (error) {
          console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
        }
      }

      // Update shardIterator for the next poll
      shardIterator = recordsData.NextShardIterator;
    } catch (error) {
      console.error(`[BACKEND] Error polling DynamoDB Stream for table ${tableName}:`, error);
      // Optionally, implement retry logic or move to the next shard
      break; // Exit the polling loop on error
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

module.exports = { listenToDynamoDbStreams };
