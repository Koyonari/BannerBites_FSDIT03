const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

// Function to get user by username
const getUserByUsername = async (username) => {
  if (!username) {
    throw new Error("Username is required");
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE_USERS,
    FilterExpression: "#username = :username",
    ExpressionAttributeNames: { "#username": "username" },
    ExpressionAttributeValues: { ":username": { S: username } },
  };

  const data = await dynamoDb.send(new ScanCommand(params));

  if (data.Items && data.Items.length > 0) {
    const item = data.Items[0];
    return {
      username: item.username.S,
      password: item.password.S,
      roles: item.roles ? item.roles.M : null,
      userId: item.userId.S
    };
  } else {
    throw new Error("User not found");
  }
};

module.exports = { getUserByUsername };
