// models/AdModel.js
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdModel = {
  // Retrieve an ad by adId
  getAdById: async (adId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Key: { adId },
    };
    const command = new GetCommand(params);
    const data = await dynamoDb.send(command);
    return data.Item;
  },

  // Save or update an ad using adId
  saveAd: async (ad) => {
    console.log(`Saving/Updating Ad with adId: ${ad.adId}`);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Key: { adId: ad.adId }, // Use 'adId' instead of 'id'
      UpdateExpression: `
        SET 
          #type = :type, 
          #content = :content, 
          #styles = :styles, 
          #updatedAt = :updatedAt, 
          #createdAt = if_not_exists(#createdAt, :createdAt)
      `,
      ExpressionAttributeNames: {
        "#type": "type",
        "#content": "content",
        "#styles": "styles",
        "#updatedAt": "updatedAt",
        "#createdAt": "createdAt",
      },
      ExpressionAttributeValues: {
        ":type": ad.type,
        ":content": ad.content,
        ":styles": ad.styles,
        ":updatedAt": new Date().toISOString(),
        ":createdAt": ad.createdAt || new Date().toISOString(),
      },
    };
    const command = new UpdateCommand(params);
    const result = await dynamoDb.send(command);
    console.log(`Ad ${ad.adId} saved/updated successfully.`);
    return result;
  },

  // Optional: Explicit update method using adId
  updateAd: async (ad) => {
    console.log(`Explicitly updating Ad with adId: ${ad.adId}`);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Key: { adId: ad.adId }, // Use 'adId' instead of 'id'
      UpdateExpression: `
        SET 
          #type = :type, 
          #content = :content, 
          #styles = :styles, 
          #updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        "#type": "type",
        "#content": "content",
        "#styles": "styles",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":type": ad.type,
        ":content": ad.content,
        ":styles": ad.styles,
        ":updatedAt": new Date().toISOString(),
      },
    };
    const command = new UpdateCommand(params);
    const result = await dynamoDb.send(command);
    console.log(`Ad ${ad.adId} explicitly updated successfully.`);
    return result;
  },
};

module.exports = AdModel;
