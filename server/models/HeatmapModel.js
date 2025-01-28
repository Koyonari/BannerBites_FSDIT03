// models/HeatmapModel.js

const { ScanCommand, BatchGetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdAnalyticsTable = process.env.DYNAMODB_TABLE_AD_ANALYTICS;
const AdAggregatesTable = process.env.DYNAMODB_TABLE_AD_AGGREGATES;

const HeatmapModel = {
  /**
   * Fetches all session data from AdAnalytics table.
   * @param {Object} lastEvaluatedKey - The key to start scanning from.
   * @returns {Promise<Object>} - Object containing items and lastEvaluatedKey.
   */
  getAllSessionData: async function (lastEvaluatedKey = null) {
    try {
      console.log("Fetching all session data from AdAnalytics table.");
      const params = {
        TableName: AdAnalyticsTable,
        ExclusiveStartKey: lastEvaluatedKey || undefined, // Avoid passing null
      };

      const command = new ScanCommand(params);
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
 * Fetches session data for a specific adId.
 * @param {string} adId - The adId to filter.
 * @returns {Promise<Object>} - Object containing fetched items.
 */
getSessionDataByAdId: async function (adId) {
  try {
    console.log(`Fetching session data for adId: ${adId}`);

    // Step 1: Fetch session IDs and adIds using Query
    const sessions = await this.getSessionIdsForAdId(adId);

    if (!sessions || sessions.length === 0) {
      console.log(`No sessions found for adId: ${adId}`);
      return { items: [] };
    }

    // Log the sessions
    console.log(`Retrieved sessions for adId ${adId}:`, sessions);

    // Step 2: Use BatchGetCommand to fetch session data
    const MAX_BATCH_SIZE = 100;
    const allSessions = [];

    for (let i = 0; i < sessions.length; i += MAX_BATCH_SIZE) {
      const chunk = sessions.slice(i, i + MAX_BATCH_SIZE);
      console.log(`Processing sessionId batch:`, chunk);

      const params = {
        RequestItems: {
          [AdAnalyticsTable]: {
            Keys: chunk.map((session) => ({
              sessionId: session.sessionId,
              adId: session.adId, // Both keys as per schema
            })),
          },
        },
      };

      console.log("BatchGetCommand params:", JSON.stringify(params, null, 2));

      const command = new BatchGetCommand(params);
      const data = await dynamoDb.send(command);

      console.log("BatchGetCommand response:", JSON.stringify(data, null, 2));

      if (data.Responses && data.Responses[AdAnalyticsTable]) {
        allSessions.push(...data.Responses[AdAnalyticsTable]);
      }

      // Optionally, handle UnprocessedKeys
      if (data.UnprocessedKeys && Object.keys(data.UnprocessedKeys).length > 0) {
        console.warn("Unprocessed keys:", data.UnprocessedKeys);
        // Implement retry logic if necessary
      }
    }

    console.log(`Fetched ${allSessions.length} sessions for adId: ${adId}`);
    return { items: allSessions };
  } catch (error) {
    console.error(`Error fetching session data by adId: ${adId}`, error);
    throw error;
  }
},

  /**
   * Fetches all sessionIds associated with a specific adId by scanning the table.
   * @param {string} adId - The adId to filter.
   * @returns {Promise<Array<{sessionId: string, adId: string}>>} - Array of session objects.
   */
  getSessionIdsForAdId: async function (adId) {
    try {
      console.log(`Fetching sessionIds for adId: ${adId}`);
      const sessions = [];
      let lastEvaluatedKey = null;
  
      do {
        const params = {
          TableName: AdAnalyticsTable,
          FilterExpression: "adId = :adId",
          ExpressionAttributeValues: {
            ":adId": adId,
          },
          ProjectionExpression: "sessionId, adId",
          Limit: 50,
          ExclusiveStartKey: lastEvaluatedKey || undefined,
        };
  
        const command = new ScanCommand(params);
        const data = await exponentialBackoff(5, () => dynamoDb.send(command)); // Add backoff
  
        if (data.Items) {
          sessions.push(...data.Items.map((item) => ({
            sessionId: item.sessionId,
            adId: item.adId,
          })));
        }
  
        lastEvaluatedKey = data.LastEvaluatedKey || undefined;
      } while (lastEvaluatedKey);
  
      console.log(`Found ${sessions.length} sessions for adId: ${adId}`);
      return sessions;
    } catch (error) {
      console.error(`Error fetching sessionIds for adId: ${adId}`, error);
      throw error;
    }
  },

  /**
   * Fetches all aggregate data from AdAggregates table.
   * @returns {Promise<Array>} - Array of aggregate records.
   */
  getAllAggregateData: async function () {
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

/**
 * Retries a given asynchronous function with exponential backoff.
 * @param {number} retries - Number of retry attempts.
 * @param {Function} fn - The function to retry.
 * @returns {Promise<any>} - The resolved value of the function.
 */
async function exponentialBackoff(retries, fn) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.name !== "ProvisionedThroughputExceededException") {
        throw error; // Rethrow for non-throttling errors
      }
      const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 100ms, 200ms, 400ms, ...
      console.warn(`Retrying after ${delay}ms due to ProvisionedThroughputExceededException...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Exponential backoff retries exhausted");
}
// Log the methods to confirm
console.log("HeatmapModel loaded with methods:", Object.keys(HeatmapModel));

module.exports = HeatmapModel;
