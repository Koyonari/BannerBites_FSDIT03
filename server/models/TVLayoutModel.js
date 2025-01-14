// models/TVLayoutModel.js
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const TVLayoutModel = {
  // Function to assign a layout to a TV
  assignLayoutToTV: async (tvId, layoutId, assignedDate) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVLAYOUTS,
      Item: {
        tvId,
        layoutId,
        assignedDate,
      },
    };
    // Use the PutCommand to save the layout assignment in DynamoDB
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },
};

module.exports = TVLayoutModel;
