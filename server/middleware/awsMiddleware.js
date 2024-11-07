const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const {
  DynamoDBStreamsClient,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} = require("@aws-sdk/client-dynamodb-streams");
const dotenv = require("dotenv");
dotenv.config();

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create DynamoDB Document Client
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

// Initialize DynamoDB Streams Client
const dynamoDbStreamsClient = new DynamoDBStreamsClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log("AWS Clients initialized in awsMiddleware");

// Function to set up DynamoDB Stream listener
const listenToDynamoDbStreams = async (wss) => {
  const tableNames = ["Layouts", "Ads", "ScheduledAds", "GridItems"];

  try {
    for (const tableName of tableNames) {
      // Define the table and obtain its Stream ARN
      const params = {
        TableName: tableName,
      };

      // Get the latest stream ARN of the table
      const describeTableCommand = new DescribeTableCommand(params);
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`Stream is not enabled for table ${tableName}`);
        continue; // Skip tables without stream enabled
      }

      // Describe the stream to get the shards
      const describeStreamParams = {
        StreamArn: streamArn,
        Limit: 10,
      };

      setInterval(async () => {
        try {
          const describeStreamCommand = new DescribeStreamCommand(describeStreamParams);
          const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);

          if (!streamData.StreamDescription.Shards || streamData.StreamDescription.Shards.length === 0) {
            console.warn(`No shards available in the stream for table ${tableName}. Retrying...`);
            return;
          }

          for (const shard of streamData.StreamDescription.Shards) {
            // Get a shard iterator
            const getShardIteratorParams = {
              StreamArn: streamArn,
              ShardId: shard.ShardId,
              ShardIteratorType: "LATEST",
            };

            const shardIteratorCommand = new GetShardIteratorCommand(getShardIteratorParams);
            const shardIteratorResponse = await dynamoDbStreamsClient.send(shardIteratorCommand);
            const shardIterator = shardIteratorResponse.ShardIterator;

            // Get records from the shard
            if (shardIterator) {
              const getRecordsCommand = new GetRecordsCommand({
                ShardIterator: shardIterator,
              });

              const recordsData = await dynamoDbStreamsClient.send(getRecordsCommand);
              if (recordsData.Records && recordsData.Records.length > 0) {
                recordsData.Records.forEach((record) => {
                  if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
                    // Broadcast data to all WebSocket clients
                    wss.clients.forEach((client) => {
                      if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "layoutUpdate", data: record.dynamodb.NewImage }));
                      }
                    });
                  }
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error while retrieving records from DynamoDB Stream for table ${tableName}:`, error);
        }
      }, 5000); // Poll every 5 seconds for updates
    }
  } catch (error) {
    console.error("Error setting up DynamoDB Streams listener:", error);
  }
};

module.exports = { dynamoDb, dynamoDbClient, s3Client, listenToDynamoDbStreams };
