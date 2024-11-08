// server/middleware/awsClients.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBStreamsClient } = require("@aws-sdk/client-dynamodb-streams");
const { S3Client } = require("@aws-sdk/client-s3");
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

// Initialize DynamoDB Document Client
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

console.log("[BACKEND] AWS Clients initialized in awsClients.js");
console.log("[BACKEND] DynamoDBStreamsClient initialized:", dynamoDbStreamsClient);
console.log("[BACKEND] S3Client initialized:", s3Client);

module.exports = {
  dynamoDbClient,
  dynamoDb,
  dynamoDbStreamsClient,
  s3Client,
};
