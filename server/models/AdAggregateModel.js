// models/AdAggregateModel.js
const { GetCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdAggregatesTable = process.env.DYNAMODB_TABLE_AD_AGGREGATES;

const AdAggregateModel = {
  /**
   * Fetches all aggregate data from the AdAggregates table.
   * @returns {Promise<Array>} - Array of aggregate records.
   */
  getAllAggregateData: async function () {
    try {
      console.log("Fetching all aggregate data from AdAggregates table.");
      const params = {
        TableName: AdAggregatesTable,
      };

      const data = await dynamoDb.send(new ScanCommand(params));

      if (!data || !data.Items || !Array.isArray(data.Items)) {
        console.warn("No aggregate data found.");
        return [];
      }

      console.log(`Fetched ${data.Items.length} aggregate records.`);
      return data.Items;
    } catch (error) {
      console.error("Error fetching aggregate data from AdAggregates:", error);
      throw error;
    }
  },

  /**
   * Fetches a single aggregate record by adId.
   * @param {string} adId - The adId of the aggregate record.
   * @returns {Promise<Object|null>} - The aggregate item or null if not found.
   */
  getAggregateDataByAdId: async function (adId) {
    try {
      console.log(`Fetching aggregate record for adId: ${adId}`);
      const params = {
        TableName: AdAggregatesTable,
        Key: { adId },
      };

      const data = await dynamoDb.send(new GetCommand(params));
      if (data.Item) {
        console.log(`Found aggregate record for adId=${adId}`, data.Item);
        return data.Item;
      } else {
        console.warn(`No aggregate record found for adId=${adId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching aggregate record for adId=${adId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes the aggregate record for a given adId.
   * @param {string} adId - The unique identifier for the ad.
   * @returns {Promise<Object>} - The deletion result.
   */
  deleteAggregateDataByAdId: async function (adId) {
    try {
      console.log(`Deleting aggregate data for adId: ${adId}`);
      const params = {
        TableName: AdAggregatesTable,
        Key: { adId },
      };
      const data = await dynamoDb.send(new DeleteCommand(params));
      console.log(`Aggregate data for adId: ${adId} deleted successfully.`);
      return data;
    } catch (error) {
      console.error(`Error deleting aggregate data for adId: ${adId}:`, error);
      throw error;
    }
  },
};

console.log("AdAggregateModel loaded with methods:", Object.keys(AdAggregateModel));

module.exports = AdAggregateModel;
