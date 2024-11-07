// awsMiddleware.js

// Import necessary AWS SDK v3 clients and utilities
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const dotenv = require('dotenv');

//Login utilities
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ensure password hashing and verification

// Load environment variables from .env file
dotenv.config();

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  },
});

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  },
});

// Create DynamoDB Document Client for simplified DynamoDB operations
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

//Login---------------------------------------------------------------------------------------------(Not sure if right place)
// Function to get user by username
const getUserByUsername = async (username) => {
  try {
      const params = {
          TableName: process.env.DYNAMODB_TABLE_USERS, // DynamoDB Users table
          Key: { username },
      };
      const { Item } = await dynamoDb.send(new GetCommand(params));
      return Item;
  } catch (error) {
      console.error('Error retrieving user:', error);
      throw new Error('Error retrieving user');
  }
};

// Function to authenticate user and generate JWT
const authenticateUser = async (username, password) => {
  const user = await getUserByUsername(username);
  if (user && await bcrypt.compare(password, user.password)) {//TODO: change Password in database to bycrypt
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return token;
  } else {
      throw new Error('Invalid credentials');
  }
};

// Export the initialized clients
module.exports = { dynamoDb, s3, authenticateUser };
