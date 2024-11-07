// models/TVLayoutModel.js
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsMiddleware");

const TVLayoutModel = {
  assignLayoutToTV: async (tvId, layoutId, assignedDate) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVLAYOUTS,
      Item: {
        tvId,
        layoutId,
        assignedDate,
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },
};

module.exports = TVLayoutModel;
