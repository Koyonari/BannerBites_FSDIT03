const { ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdAnalyticsTable = process.env.DYNAMODB_TABLE_AD_ANALYTICS;
const AdAggregatesTable = process.env.DYNAMODB_TABLE_AD_AGGREGATES;

const HeatmapModel = {
  /**
   * Fetches all session data from AdAnalytics table.
   * @returns {Promise<Object>} - Object containing items and lastEvaluatedKey.
   */
  getAllSessionData: async (lastEvaluatedKey = null) => {
    try {
      console.log("Fetching all session data from AdAnalytics table.");
      const params = {
        TableName: AdAnalyticsTable,
        ExclusiveStartKey: lastEvaluatedKey || undefined, // Avoid null values
      };

      const command = new ScanCommand(params); // Use ScanCommand here
      const data = await dynamoDb.send(command);

      if (!data || !data.Items || !Array.isArray(data.Items)) {
        console.warn("No valid session data found.");
        return { items: [], lastEvaluatedKey: null };
      }

      console.log(`Fetched ${data.Items.length} session records.`);
      return {
        items: data.Items,
        lastEvaluatedKey: data.LastEvaluatedKey || null,
      };
    } catch (error) {
      console.error("Error fetching session data from AdAnalytics:", error);
      throw error;
    }
  },

  /**
   * Fetches session data filtered by adIds using a Scan operation.
   * This implementation supports pagination.
   * @param {Array<string>} adIds - List of adIds to filter by.
   * @param {Object} lastEvaluatedKey - The pagination key from the previous request (optional).
   * @returns {Promise<Object>} - Object containing filtered items and lastEvaluatedKey.
   */
  getSessionDataByAdIds: async (adIds, lastEvaluatedKey = null) => {
    try {
      console.log("Fetching session data for adIds:", adIds);

      const params = {
        TableName: AdAnalyticsTable,
        ExclusiveStartKey: lastEvaluatedKey || undefined, // Support pagination
      };

      const command = new ScanCommand(params);
      const data = await dynamoDb.send(command);

      if (!data.Items || !Array.isArray(data.Items)) {
        console.warn("No session data found.");
        return { items: [], lastEvaluatedKey: null };
      }

      // Filter sessions by adId
      const filteredSessions = data.Items.filter((session) =>
        adIds.includes(session.adId)
      );

      console.log(`Fetched ${filteredSessions.length} session records for adIds.`);
      return {
        items: filteredSessions,
        lastEvaluatedKey: data.LastEvaluatedKey || null,
      };
    } catch (error) {
      console.error("Error fetching session data by adIds:", error);
      throw error;
    }
  },

  /**
   * Fetches all aggregate data from AdAggregates table.
   * @returns {Promise<Array>} - Array of aggregate records.
   */
  getAllAggregateData: async () => {
    try {
      console.log("Fetching all aggregate data from AdAggregates table.");
      const params = {
        TableName: AdAggregatesTable,
      };

      const command = new ScanCommand(params);
      const data = await dynamoDb.send(command);

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
};

module.exports = HeatmapModel;
