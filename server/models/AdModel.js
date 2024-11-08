// models/AdModel.js
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdModel = {
  // Retrieve an ad by adId
  getAdById: async (adId) => {
    try {
      console.log(`Fetching Ad with adId: ${adId}, type of adId: ${typeof adId}`);
  
      const key = {
        adId: adId, // Ensure this matches your DynamoDB key schema exactly
      };
  
      console.log(`Using key for GetCommand in Ads table: ${JSON.stringify(key)}`);
  
      const adResult = await dynamoDb.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_ADS,
        Key: key,
      }));
  
      if (!adResult.Item) {
        console.error(`No Ad found with adId: ${adId}`);
        return null; // Ad not found
      }
  
      console.log(`Fetched Ad details: ${JSON.stringify(adResult.Item)}`);
      return adResult.Item;
  
    } catch (error) {
      console.error(`Error fetching Ad with adId: ${adId}`, error);
      throw error; // Rethrow the error to be handled by the caller
    }
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
  
  deleteAdById: async (adId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_ADS,
      Key: { adId },
    };
    const command = new DeleteCommand(params);
    try {
      await dynamoDb.send(command);
      console.log(`Ad with adId ${adId} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting ad with adId ${adId}:`, error);
      throw error;
    }
  },
};

module.exports = AdModel;
