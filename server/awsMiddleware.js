// awsMiddleware.js
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Initialize DynamoDB DocumentClient and S3
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports = { dynamoDb, s3 };
