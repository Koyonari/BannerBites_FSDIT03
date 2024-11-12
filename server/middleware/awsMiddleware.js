const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const debounce = require("lodash.debounce");
const { layoutUpdatesCache, clients } = require("../state");  // Import layoutUpdatesCache and clients
const { dynamoDbClient, dynamoDbStreamsClient } = require("./awsClients");
const { fetchLayoutById, getLayoutsByAdId } = require("../services/layoutService");
const WebSocket = require("ws");

/**
 * Broadcast function for sending layout updates to WebSocket clients.
 * @param {string} layoutId - The ID of the layout to update.
 * @param {object} updatedData - The updated layout data.
 */
const broadcastLayoutUpdate = (layoutId, updatedData) => {
  if (!updatedData || !updatedData.gridItems) {
    console.error(`[Backend] Invalid layout data for layoutId: ${layoutId}`);
    return;
  }

  // Filter out gridItems that have invalid scheduled ads
  updatedData.gridItems = updatedData.gridItems.map(item => {
    if (item && item.scheduledAds) {
      item.scheduledAds = item.scheduledAds.filter(scheduledAd => scheduledAd && scheduledAd.ad && scheduledAd.ad.adId);
    }
    return item;
  });

  clients.forEach((clientData, clientWs) => {
    if (clientData.layoutId === layoutId && clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(JSON.stringify({ type: "layoutUpdate", data: updatedData }));
        console.log(`[Backend] Broadcasted layout update for layoutId: ${layoutId}`);
      } catch (error) {
        console.error(`[Backend] Error broadcasting to client for layoutId: ${layoutId}`, error);
      }
    }
  });
};

// Debounce the broadcast function to reduce unnecessary broadcasts
const debouncedBroadcastLayoutUpdate = debounce(broadcastLayoutUpdate, 1000); // 1 second debounce

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
            layoutUpdatesCache[layoutId] = fullLayout; // Use `layoutUpdatesCache` directly here
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
    } catch (error) {
      console.error(`[BACKEND] Error polling DynamoDB Stream for table ${tableName}:`, error);
      break; // Exit the polling loop on error
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

module.exports = { listenToDynamoDbStreams };
