// awsMiddleware.js

// Import necessary AWS SDK v3 clients and utilities
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

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
// awsMiddleware.js

const getUserByUsername = async (username) => {
  if (!username) {
      throw new Error("Username is required");
  }
  try {
      const params = {
          TableName: process.env.DYNAMODB_TABLE_USERS,
          FilterExpression: "username = :username",
          ExpressionAttributeValues: {
              ":username": username,
          },
      };
      const data = await dynamoDb.send(new ScanCommand(params));
      
      console.log("DynamoDB scan result:", data); // Debug: Check DynamoDB response

      // Assuming `username` is unique, return the first matching item
      if (data.Items && data.Items.length > 0) {
          return data.Items[0];
      } else {
          console.log("User not found"); // Debug: No user matched
          throw new Error("User not found");
      }
  } catch (error) {
      console.error("Error retrieving user:", error);
      throw new Error("Error retrieving user");
  }
};




const authenticateUser = async (username, password) => {
  const user = await getUserByUsername(username);
  console.log("User found:", user); // Debug: Check retrieved user details
  console.log("Entered password:", password); // Debug: Log entered password
  console.log("Stored password:", user.password); // Debug: Log stored password in DynamoDB

  if (user && user.password.trim() === password.trim()) {  // Direct password comparison
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log("Authentication successful, token generated:", token); // Debug
      return token;
  } else {
      console.log("Password did not match"); // Debug
      throw new Error("Invalid credentials");
  }
};




// Export the initialized clients
module.exports = { dynamoDb, s3, authenticateUser };
