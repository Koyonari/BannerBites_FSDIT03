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
          const eventName = record.eventName;
          const newImage = record.dynamodb.NewImage;
          if (!newImage) return;

          const newItem = unmarshall(newImage);
          const { adId, dwellTime } = newItem;
          let { gazeSamples } = newItem; // Use 'let' to allow reassignment

          if ((eventName === "INSERT" || eventName === "MODIFY") && adId) {
            console.log(`[HEATMAP] Detected new AdAnalytics entry/modify for adId: ${adId}`);

            let points = [];

            // Parse 'gazeSamples' if it's a string
            if (typeof gazeSamples === "string") {
              try {
                gazeSamples = JSON.parse(gazeSamples); // Convert string to array
              } catch (error) {
                console.error(`[HEATMAP] Error parsing gazeSamples for adId: ${adId}`, error);
                gazeSamples = []; // Default to empty array if parsing fails
              }
            }

            // Ensure 'gazeSamples' is an array
            if (Array.isArray(gazeSamples)) {
              points = gazeSamples.map((s, index) => {
                if (typeof s !== 'object' || s === null) {
                  console.warn(`[HEATMAP] Invalid gazeSample at index ${index} for adId: ${adId}`, s);
                  return null; // Skip invalid entries
                }
                const { x, y, value } = s;
                return {
                  x: typeof x === 'number' ? x : 0, // Default to 0 if invalid
                  y: typeof y === 'number' ? y : 0, // Default to 0 if invalid
                  value: typeof value === 'number' ? value : 1, // Default to 1 if invalid
                };
              }).filter(point => point !== null); // Remove any null entries

              console.log(`[HEATMAP] Processed ${points.length} gaze points for adId: ${adId}`);
            } else {
              console.warn(`[HEATMAP] gazeSamples is not an array for adId: ${adId}`, gazeSamples);
              points = [];
            }

            // Ensure 'dwellTime' is a valid number
            const validDwellTime = typeof dwellTime === 'number' && !isNaN(dwellTime) ? dwellTime : 0;

            broadcastHeatmapUpdate([adId], {
              updatedAdIds: [adId],
              points,
              dwellTime: validDwellTime, // Ensure dwellTime is never undefined
            });
          } 
          // Optional: Handle updates for AdAggregates table
          else if (tableName === process.env.DYNAMODB_TABLE_AD_AGGREGATES) {
            console.log(`[HEATMAP] AdAggregates update detected for adId: ${adId}`);
            // Implement similar logic if needed
          }
        });
      }

      shardIterator = NextShardIterator;
      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[HEATMAP] Error polling DynamoDB Streams for table ${tableName}:`, error);
      break; // Exit the loop on error to prevent infinite retries
    }
  }
};

/**
 * Sets up stream listeners for AdAnalytics and AdAggregates tables,
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

      // 3) For each shard, get an iterator and start polling
      for (const shard of shards) {
        const getShardIteratorCommand = new GetShardIteratorCommand({
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST", // Use LATEST to get recent updates
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
