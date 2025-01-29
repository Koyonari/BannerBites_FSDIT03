// middleware/heatmapListener.js

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

const { broadcastHeatmapUpdate } = require("../state/heatmapState");

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDbStreamsClient = new DynamoDBStreamsClient({
  region: process.env.AWS_REGION,
});

/**
 * Polls a single shard's iterator for new records, transforms them,
 * and broadcasts them via the heatmap broadcast function.
 */
const pollHeatmapStream = async (shardIterator, tableName) => {
  while (shardIterator) {
    try {
      const command = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
      });
      const { Records, NextShardIterator } = await dynamoDbStreamsClient.send(command);

      if (Records && Records.length > 0) {
        Records.forEach((record) => {
          const eventName = record.eventName; // e.g. INSERT, MODIFY, REMOVE
          const newImage = record.dynamodb?.NewImage;
          if (!newImage) return; // no new data in the record

          const newItem = unmarshall(record.dynamodb.NewImage);
          const { adId, gazeSamples, dwellTime } = newItem;

          // If it’s from the AdAnalytics table
          if (tableName === process.env.DYNAMODB_TABLE_AD_ANALYTICS) {
            if ((eventName === "INSERT" || eventName === "MODIFY") && adId) {
              console.log(`[HEATMAP] Detected new AdAnalytics entry/modify for adId: ${adId}`);
              
              // Transform gazeSamples into points
              const points = Array.isArray(gazeSamples)
              ? gazeSamples.map(s => ({
                  x: s.x,
                  y: s.y,
                  value: s.value || 1,
                }))
              : [];
              
              // Broadcast to all clients subscribed to this adId
              broadcastHeatmapUpdate([adId], {
                updatedAdIds: [adId],
                points,
                dwellTime: dwellTime || 0,
              });
            }
          }

          // Optionally do the same logic for AdAggregates table
          else if (tableName === process.env.DYNAMODB_TABLE_AD_AGGREGATES) {
            // handle updates that might contain gaze data
          }
        });
      }

      shardIterator = NextShardIterator;
      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[HEATMAP] Error polling DynamoDB Streams for table ${tableName}:`, error);
      break;
    }
  }
};

/**
 * Sets up stream listeners for AdAnalytics/AdAggregates tables (if needed),
 * fetches shards, and starts polling each shard for new records.
 */
const listenToHeatmapStreams = async () => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_AD_ANALYTICS,
    process.env.DYNAMODB_TABLE_AD_AGGREGATES,
  ];

  for (const tableName of tableNames) {
    if (!tableName) {
      console.error("[HEATMAP] Table name env var not set.");
      continue;
    }

    try {
      console.log(`[HEATMAP] Listening to DynamoDB Stream for table: ${tableName}`);
      
      // 1) Describe the table to get the StreamArn
      const describeTableCommand = new DescribeTableCommand({ TableName: tableName });
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;
      if (!streamArn) {
        console.error(`[HEATMAP] Stream is not enabled for table ${tableName}`);
        continue;
      }

      // 2) Describe the stream to get shards
      const describeStreamCommand = new DescribeStreamCommand({ StreamArn: streamArn });
      const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);
      const shards = streamData.StreamDescription.Shards;

      if (!shards || shards.length === 0) {
        console.warn(`[HEATMAP] No shards available for table stream: ${tableName}`);
        continue;
      }

      // 3) For each shard, get an iterator and poll
      for (const shard of shards) {
        const getShardIteratorCommand = new GetShardIteratorCommand({
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST", // or TRIM_HORIZON if you want from the beginning
        });
        const shardIteratorResponse = await dynamoDbStreamsClient.send(getShardIteratorCommand);
        const shardIterator = shardIteratorResponse.ShardIterator;

        if (shardIterator) {
          console.log(`[HEATMAP] Starting stream polling: table=${tableName}, shardId=${shard.ShardId}`);
          pollHeatmapStream(shardIterator, tableName);
        }
      }
    } catch (error) {
      console.error(`[HEATMAP] Error setting up DynamoDB stream for ${tableName}:`, error);
    }
  }
};

module.exports = { listenToHeatmapStreams };
