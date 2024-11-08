// models/LocationModel.js
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const LocationModel = {
  getAllLocations: async () => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
    };
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
};

module.exports = LocationModel;
