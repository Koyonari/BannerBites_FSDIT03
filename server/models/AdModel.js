// models/AdModel.js
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdModel = {
  saveAd: async (ad) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Item: {
        adId: ad.id,
        type: ad.type,
        content: ad.content,
        styles: ad.styles,
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },

  getAdById: async (adId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Key: { adId },
    };
    const command = new GetCommand(params);
    const data = await dynamoDb.send(command);
    return data.Item;
  },
};

module.exports = AdModel;
