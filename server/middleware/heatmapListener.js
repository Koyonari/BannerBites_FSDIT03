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

// Poll DynamoDB Streams for AdAnalytics and AdAggregates
const pollHeatmapStream = async (shardIterator, tableName) => {
  while (shardIterator) {
    try {
      const command = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
      });
      const { Records, NextShardIterator } =
        await dynamoDbStreamsClient.send(command);

      if (Records && Records.length > 0) {
        Records.forEach((record) => {
          const eventName = record.eventName; // e.g., INSERT, MODIFY
          const newItem = unmarshall(record.dynamodb.NewImage);

          // Function to transform DynamoDB records into heatmap points
          const transformNewItemToPoints = (newItem) => {
            if (Array.isArray(newItem.gazeSamples)) {
              return newItem.gazeSamples.map((sample) => ({
                x: sample.x,
                y: sample.y,
                value: sample.value || 1,
              }));
            }
            return [];
          };

          if (tableName === process.env.DYNAMODB_TABLE_AD_AGGREGATES) {
            if (
              (eventName === "MODIFY" || eventName === "INSERT") &&
              newItem.adId
            ) {
              console.log(
                `[HEATMAP] Detected AdAggregates change for adId: ${newItem.adId}`,
              );
              const points = transformNewItemToPoints(newItem);
              broadcastHeatmapUpdate(newItem.adId, points); // Broadcast based on adId
            }
          } else if (tableName === process.env.DYNAMODB_TABLE_AD_ANALYTICS) {
            if (eventName === "INSERT" && newItem.adId) {
              console.log(
                `[HEATMAP] Detected new AdAnalytics entry for adId: ${newItem.adId}`,
              );
              const { gazeSamples } = newItem;

              if (Array.isArray(gazeSamples)) {
                const points = gazeSamples.map((sample) => ({
                  x: sample.x,
                  y: sample.y,
                  value: sample.value || 1,
                }));
                broadcastHeatmapUpdate(newItem.adId, points); // Use adId for consistency
              }
            }
          }
        });
      }

      shardIterator = NextShardIterator;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
    } catch (error) {
      console.error(
        `[HEATMAP] Error polling DynamoDB Streams for table ${tableName}:`,
        error,
      );
      break;
    }
  }
};

// Set up DynamoDB Stream listeners for AdAnalytics and AdAggregates tables
const listenToHeatmapStreams = async () => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_AD_ANALYTICS,
    process.env.DYNAMODB_TABLE_AD_AGGREGATES,
  ];

  for (const tableName of tableNames) {
    try {
      if (!tableName) {
        console.error(
          `[HEATMAP] Environment variable for tableName is not set.`,
        );
        continue;
      }

      console.log(
        `[HEATMAP] Listening to DynamoDB Stream for table: ${tableName}`,
      );
      const describeTableCommand = new DescribeTableCommand({
        TableName: tableName,
      });
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`[HEATMAP] Stream is not enabled for table ${tableName}`);
        continue;
      }

      const describeStreamCommand = new DescribeStreamCommand({
        StreamArn: streamArn,
      });
      const streamData = await dynamoDbStreamsClient.send(
        describeStreamCommand,
      );
      const shards = streamData.StreamDescription.Shards;

      if (!shards || shards.length === 0) {
        console.warn(
          `[HEATMAP] No shards available in the stream for table ${tableName}`,
        );
        continue;
      }

      for (const shard of shards) {
        const getShardIteratorCommand = new GetShardIteratorCommand({
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST",
        });
        const shardIteratorResponse = await dynamoDbStreamsClient.send(
          getShardIteratorCommand,
        );
        const shardIterator = shardIteratorResponse.ShardIterator;

        if (shardIterator) {
          console.log(
            `[HEATMAP] Starting to poll stream for table: ${tableName}, shardId: ${shard.ShardId}`,
          );
          pollHeatmapStream(shardIterator, tableName); // Pass the tableName
        }
      }
    } catch (error) {
      console.error(
        `[HEATMAP] Error setting up DynamoDB Streams listener for table ${tableName}:`,
        error,
      );
    }
  }
};

module.exports = { listenToHeatmapStreams };
