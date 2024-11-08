// models/TVModel.js
const { QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const TVModel = {
  getIndexStatus: async (tableName, indexName) => {
    const params = {
      TableName: tableName,
    };
    const command = new DescribeTableCommand(params);
    const data = await dynamoDbClient.send(command);
    const index = data.Table.GlobalSecondaryIndexes.find(
      (i) => i.IndexName === indexName
    );
    return index ? index.IndexStatus : "NOT_FOUND";
  },

  getTVsByLocationId: async (locationId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVS,
      IndexName: "locationId-index",
      KeyConditionExpression: "locationId = :locationId",
      ExpressionAttributeValues: {
        ":locationId": locationId,
      },
    };
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  scanTVsByLocationId: async (locationId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVS,
      FilterExpression: "locationId = :locationId",
      ExpressionAttributeValues: {
        ":locationId": locationId,
      },
    };
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
};

module.exports = TVModel;
