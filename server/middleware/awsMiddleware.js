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
        records.forEach((record) => {
          if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
            const updatedItem = unmarshall(record.dynamodb.NewImage);
            let updateType, itemId;

            switch (tableName) {
              case process.env.DYNAMODB_TABLE_LAYOUTS:
                updateType = "layoutUpdate";
                itemId = updatedItem.layoutId;
                break;
              case process.env.DYNAMODB_TABLE_GRIDITEMS:
                updateType = "gridItemUpdate";
                itemId = updatedItem.layoutId;
                break;
              case process.env.DYNAMODB_TABLE_SCHEDULEDADS:
                updateType = "scheduledAdUpdate";
                itemId = updatedItem.layoutId;
                break;
              case process.env.DYNAMODB_TABLE_ADS:
                updateType = "adUpdate";
                itemId = updatedItem.adId;
                break;
              default:
                updateType = "unknownUpdate";
                itemId = updatedItem.id || updatedItem.layoutId;
            }

            console.log(`[BACKEND] Changed JSON Layout from ${tableName}:`, JSON.stringify(updatedItem, null, 2));

            // Update cache
            if (updateType === "layoutUpdate" || updateType === "layoutData") {
              layoutUpdatesCache[itemId] = updatedItem;
              console.log(`[BACKEND] Cached updated layout for layoutId: ${itemId}`);
            }

            // Send update to clients interested in this layoutId
            // When sending updates to clients
            if (clients && clients.length > 0) {
              clients.forEach((client) => {
                if (client.layoutId === itemId) {
                  client.res.write(`data: ${JSON.stringify({ type: updateType, data: updatedItem })}\n\n`);
                  console.log(`[BACKEND] Sent ${updateType} to client ${client.id} for layoutId: ${itemId}`);
                }
              });
            } else {
              console.warn("[BACKEND] No SSE clients connected.");
            }
          }
        });
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
