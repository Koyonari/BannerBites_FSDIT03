// middleware/awsMiddleware.js

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

console.log("AWS Clients initialized in awsMiddleware");

// Function to set up DynamoDB Stream listener
const listenToDynamoDbStreams = async (io) => {
  const tableNames = [
    process.env.DYNAMODB_TABLE_LAYOUTS,
    process.env.DYNAMODB_TABLE_GRIDITEMS,
    process.env.DYNAMODB_TABLE_SCHEDULEDADS,
    process.env.DYNAMODB_TABLE_ADS,
  ];

  for (const tableName of tableNames) {
    // Define the table and obtain its Stream ARN
    const params = {
      TableName: tableName,
    };

    try {
      // Get the latest stream ARN of the table
      const describeTableCommand = new DescribeTableCommand(params);
      const data = await dynamoDbClient.send(describeTableCommand);
      const streamArn = data.Table.LatestStreamArn;

      if (!streamArn) {
        console.error(`Stream is not enabled for table ${tableName}`);
        continue; // Skip tables without stream enabled
      }

      console.log(`Listening to DynamoDB Stream for table ${tableName}: ${streamArn}`);

      // Describe the stream to get the shards
      const describeStreamParams = {
        StreamArn: streamArn,
        Limit: 10,
      };

      const describeStreamCommand = new DescribeStreamCommand(describeStreamParams);
      const streamData = await dynamoDbStreamsClient.send(describeStreamCommand);

      if (!streamData.StreamDescription.Shards || streamData.StreamDescription.Shards.length === 0) {
        console.warn(`No shards available in the stream for table ${tableName}.`);
        continue;
      }

      for (const shard of streamData.StreamDescription.Shards) {
        const getShardIteratorParams = {
          StreamArn: streamArn,
          ShardId: shard.ShardId,
          ShardIteratorType: "LATEST", // Start from the latest records
        };

        const shardIteratorCommand = new GetShardIteratorCommand(getShardIteratorParams);
        const shardIteratorResponse = await dynamoDbStreamsClient.send(shardIteratorCommand);
        let shardIterator = shardIteratorResponse.ShardIterator;

        if (shardIterator) {
          // Start polling for records
          pollStream(shardIterator, tableName, io);
        }
      }
    } catch (error) {
      console.error(`Error setting up DynamoDB Streams listener for table ${tableName}:`, error);
    }
  }
};

// Function to poll a shard for records
// Function to poll a shard for records
const pollStream = async (shardIterator, tableName, io) => {
  while (shardIterator) {
    try {
      const getRecordsCommand = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100, // Adjust as needed
      });

      const recordsData = await dynamoDbStreamsClient.send(getRecordsCommand);
      const records = recordsData.Records;

      if (records && records.length > 0) {
        records.forEach((record) => {
          if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
            // Unmarshall the DynamoDB item to a normal JS object
            const updatedItem = unmarshall(record.dynamodb.NewImage);

            // Determine the type of update based on the table
            let updateType;
            let itemId;
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
                itemId = updatedItem.adId || updatedItem.id; // Double check for correct key
                break;
              default:
                updateType = "unknownUpdate";
                itemId = updatedItem.id || updatedItem.layoutId;
            }

            // Log the changed JSON layout
            console.log(`Changed JSON Layout from ${tableName}:`, JSON.stringify(updatedItem, null, 2));

            // Broadcast updated item to all Socket.IO clients
            if (io) {
              io.emit(updateType, updatedItem);
              console.log(`Broadcasted ${updateType} for item: ${itemId}`);
            } else {
              console.error("Socket.IO server is not defined or no clients connected.");
            }
          }
        });
      }

      // Update the shard iterator
      shardIterator = recordsData.NextShardIterator;
    } catch (error) {
      console.error(`Error polling DynamoDB Stream for table ${tableName}:`, error);
      // Optionally implement retry logic or break
      break;
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
  }
};

module.exports = { dynamoDb, dynamoDbClient, s3Client, listenToDynamoDbStreams };
