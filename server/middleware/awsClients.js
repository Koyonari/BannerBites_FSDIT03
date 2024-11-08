// server/middleware/awsClients.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBStreamsClient } = require("@aws-sdk/client-dynamodb-streams"); // Add this line
const { S3Client } = require("@aws-sdk/client-s3");
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

console.log("[BACKEND] AWS Clients initialized in awsClients.js");

module.exports = {
  dynamoDbClient,
  dynamoDb,
  dynamoDbStreamsClient,
  s3Client,
};
