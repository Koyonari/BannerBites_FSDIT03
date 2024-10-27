// testDynamoDb.js

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

const dynamoDbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

const params = {
  TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
};

(async () => {
  try {
    console.log('Scanning table:', params.TableName);
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    console.log('Data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
})();