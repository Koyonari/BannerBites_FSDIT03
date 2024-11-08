// awsMiddleware.js

// Import necessary AWS SDK v3 clients and utilities
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ScanCommand} = require('@aws-sdk/client-dynamodb');
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
  if (!username) {
    throw new Error("Username is required");
  }

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_USERS,
      FilterExpression: "#username = :username",
      ExpressionAttributeNames: {
        "#username": "username"
      },
      ExpressionAttributeValues: {
        ":username": { S: username }
      },
    };

    const data = await dynamoDbClient.send(new ScanCommand(params));

    console.log("DynamoDB scan result:", JSON.stringify(data, null, 2)); // Debug: Print full result

    if (data.Items && data.Items.length > 0) {
      const item = data.Items[0];

      // Extract values
      return {
        username: item.username.S,
        password: item.password.S,
        roles: item.roles ? item.roles.M : null,  // Adjust if roles is a map or different structure
        userId: item.userId.S
      };
    } else {
      console.log("User not found"); // Debug: No user matched
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error retrieving user:", error);
    throw new Error("Error retrieving user");
  }
};

// Function to compare a password with a hashed password
const verifyPassword = async (password, hashedPassword) => {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error('Error verifying password');
  }
};


// Function to authenticate user and generate JWT
const authenticateUser = async (username, password) => {
  const user = await getUserByUsername(username);
  /*
  if (user && await bcrypt.compare(password, user.password)) {//TODO: change Password in database to bycrypt
  console.log("User found:", user); // Debug: Check retrieved user details
  console.log("Entered password:", password); // Debug: Log entered password
  console.log("Stored password:", user.password); // Debug: Log stored password in DynamoDB
  if (user && user.password.trim() === password.trim()) {  // Direct password comparison
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log("Authentication successful, token generated:", token); // Debug
      return token;
  } else {
      throw new Error('Invalid credentials');
      console.log("Password did not match"); // Debug
      throw new Error("Invalid credentials");
  }
  */
 /*
  if (user && user.password === password) {  // Direct password comparison
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
  } else {
    throw new Error('Invalid credentials');
  }
  */
  
  if (user && await verifyPassword(password, user.password)) { // Compare password securely
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
  } else {
    throw new Error('Invalid credentials');
  }
};
const verifyToken = (req, res, next) => {
  const token = req.cookies.authToken; // Get token from cookies

  if (!token) {
    return res.status(403).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/*
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});
*/


// Export the initialized clients
module.exports = { dynamoDb, s3, authenticateUser, verifyToken };