// middleware/aggregateListener.js
const {
    DynamoDBClient,
    DescribeTableCommand,
  } = require("@aws-sdk/client-dynamodb");
  const {
    DynamoDBStreamsClient,
    DescribeStreamCommand,
    GetShardIteratorCommand,
    GetRecordsCommand,
  } = require("@aws-sdk/client-dynamodb-streams");
  const { unmarshall } = require("@aws-sdk/util-dynamodb");
  const { broadcastAggregateUpdate } = require("../state/aggregatesState"); // your aggregator state code
  
  // Create clients for DynamoDB & Streams
  const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  const dynamoDbStreamsClient = new DynamoDBStreamsClient({
    region: process.env.AWS_REGION,
  });
  
  /**
   * Entry point: sets up a DynamoDB Streams listener for your AdAggregates table,
   * fetches shards, and polls each shard for new aggregator records.
   */
  async function listenToAggregateStream() {
    const tableName = process.env.DYNAMODB_TABLE_AD_AGGREGATES;
    if (!tableName) {
      console.error("[Aggregator] Missing DYNAMODB_TABLE_AD_AGGREGATES env var.");
      return;
    }
  
    console.log(`[Aggregator] Listening to aggregator table: ${tableName}`);
  
    try {
      // 1) Describe the table to get the StreamArn
      const describeTableResp = await dynamoDbClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      const streamArn = describeTableResp.Table.LatestStreamArn;
      if (!streamArn) {
        console.error(`[Aggregator] Stream not enabled for table ${tableName}`);
        return;
      }
  
      // 2) Describe the stream to list shards
      const streamData = await dynamoDbStreamsClient.send(
        new DescribeStreamCommand({ StreamArn: streamArn })
      );
      const shards = streamData.StreamDescription.Shards;
      if (!shards || shards.length === 0) {
        console.warn(`[Aggregator] No shards found for table ${tableName}`);
        return;
      }
  
      // 3) Get a shard iterator for each shard and start polling
      for (const shard of shards) {
        const shardIteratorResp = await dynamoDbStreamsClient.send(
          new GetShardIteratorCommand({
            StreamArn: streamArn,
            ShardId: shard.ShardId,
            ShardIteratorType: "LATEST", // or "TRIM_HORIZON" if you want from the start
          })
        );
        let shardIterator = shardIteratorResp.ShardIterator;
        if (shardIterator) {
          console.log(
            `[Aggregator] Starting stream polling: table=${tableName}, shardId=${shard.ShardId}`
          );
          pollAggregatorStream(shardIterator, tableName);
        }
      }
    } catch (error) {
      console.error(`[Aggregator] Error setting up aggregator stream:`, error);
    }
  }
  
  /**
   * Poll a shard for new records. On each poll:
   * - If there's a new "INSERT" or "MODIFY" event,
   *   read aggregator fields and broadcast them via WebSocket.
   */
  async function pollAggregatorStream(shardIterator, tableName) {
    while (shardIterator) {
      try {
        const { Records, NextShardIterator } = await dynamoDbStreamsClient.send(
          new GetRecordsCommand({
            ShardIterator: shardIterator,
            Limit: 100,
          })
        );
  
        if (Records && Records.length > 0) {
          for (const record of Records) {
            const eventName = record.eventName; // "INSERT", "MODIFY", "REMOVE"
            const newImage = record.dynamodb?.NewImage;
            if (!newImage) continue; // Nothing to parse
  
            const item = unmarshall(newImage);
  
            // If this is an aggregator insert/modify, broadcast changes
            if (eventName === "INSERT" || eventName === "MODIFY") {
              const {
                adId,
                totalSessions,
                totalDwellTime,
                totalGazeSamples,
              } = item;
  
              console.log(
                `[Aggregator] Detected aggregator update for adId=${adId}`
              );
  
              // Now broadcast via your aggregator state
              broadcastAggregateUpdate(adId, {
                totalSessions,
                totalDwellTime,
                totalGazeSamples,
              });
            }
          }
        }
  
        shardIterator = NextShardIterator;
        // Pause briefly between polls
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `[Aggregator] Error polling stream for table ${tableName}:`,
          error
        );
        break;
      }
    }
  }
  
  module.exports = { listenToAggregateStream };
  