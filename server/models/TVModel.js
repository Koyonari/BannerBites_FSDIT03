// models/TVModel.js
const { QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const TVModel = {
  // Function to get a TV by its ID
  getIndexStatus: async (tableName, indexName) => {
    const params = {
      TableName: tableName,
    };
    // Use the DescribeTableCommand to get the status of the index
    const command = new DescribeTableCommand(params);
    const data = await dynamoDb.send(command);
    const index = data.Table.GlobalSecondaryIndexes.find(
      (i) => i.IndexName === indexName
    );
    return index ? index.IndexStatus : "NOT_FOUND";
  },
  // Function to get a TV by its ID
  getTVsByLocationId: async (locationId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVS,
      IndexName: "locationId-index",
      KeyConditionExpression: "locationId = :locationId",
      ExpressionAttributeValues: {
        ":locationId": locationId,
      },
    };
    // Use the QueryCommand to fetch the TVs from DynamoDB
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
  // Function to get a TV by its ID
  scanTVsByLocationId: async (locationId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVS,
      FilterExpression: "locationId = :locationId",
      ExpressionAttributeValues: {
        ":locationId": locationId,
      },
    };
    // Use the ScanCommand to fetch the TVs from DynamoDB
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
};

module.exports = TVModel;
