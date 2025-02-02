// models/AdAnalyticsModel.js
const { GetCommand, ScanCommand, BatchGetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const AdAnalyticsTable = process.env.DYNAMODB_TABLE_AD_ANALYTICS;

/**
 * Retries a given asynchronous function with exponential backoff.
 * @param {number} retries - Number of retry attempts.
 * @param {Function} fn - The function to retry.
 * @param {number} baseDelay - Base delay in milliseconds for backoff.
 * @returns {Promise<any>} - The resolved value of the function.
 */
async function exponentialBackoff(retries, fn, baseDelay = 500) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.name !== "ProvisionedThroughputExceededException") {
        throw error;
      }
      const delay = Math.pow(2, attempt) * baseDelay;
      console.warn(`Retrying after ${delay}ms due to ProvisionedThroughputExceededException...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Exponential backoff retries exhausted");
}

const AdAnalyticsModel = {
  /**
   * Fetches all session data from the AdAnalytics table.
   * @param {Object} lastEvaluatedKey - The key to start scanning from.
   * @returns {Promise<Object>} - Object containing items and lastEvaluatedKey.
   */
  getAllSessionData: async function (lastEvaluatedKey = null) {
    try {
      console.log("Fetching all session data from AdAnalytics table.");
      const params = {
        TableName: AdAnalyticsTable,
        ExclusiveStartKey: lastEvaluatedKey || undefined,
      };

      const command = () => dynamoDb.send(new ScanCommand(params));
      const data = await exponentialBackoff(5, command);

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
   * @param {string} adId - The adId to filter by.
   * @returns {Promise<Object>} - Object containing fetched session items.
   */
  getSessionDataByAdId: async function (adId) {
    try {
      console.log(`Fetching session data for adId: ${adId}`);
      const sessionIds = await this.getSessionIdsForAdId(adId);
      const sessions = await this.getSessionDataBySessionIds(sessionIds);
      console.log(`Fetched ${sessions.length} sessions for adId: ${adId}`);
      return { items: sessions };
    } catch (error) {
      console.error(`Error fetching session data for adId: ${adId}`, error);
      throw error;
    }
  },

  /**
   * Fetches session data in batches using an array of session objects.
   * @param {Array<Object>} sessionIds - Array of objects containing sessionId and adId.
   * @param {number} batchSize - Number of items to fetch in each batch.
   * @returns {Promise<Array>} - Array of session data.
   */
  getSessionDataBySessionIds: async function (sessionIds, batchSize = 100) {
    try {
      console.log(`Fetching session data for ${sessionIds.length} session IDs in batches.`);
      const allData = [];

      for (let i = 0; i < sessionIds.length; i += batchSize) {
        const batch = sessionIds.slice(i, i + batchSize).map(({ sessionId, adId }) => ({
          sessionId,
          adId,
        }));

        const params = {
          RequestItems: {
            [AdAnalyticsTable]: {
              Keys: batch,
              ProjectionExpression: "sessionId, dwellTime, gazeSamples, adId",
            },
          },
        };

        const command = () => dynamoDb.send(new BatchGetCommand(params));
        const data = await exponentialBackoff(5, command);

        if (data.Responses && data.Responses[AdAnalyticsTable]) {
          data.Responses[AdAnalyticsTable].forEach((item) => {
            const cleanedGazeSamples = item.gazeSamples
              ? JSON.parse(item.gazeSamples).map(({ type, ...rest }) => rest)
              : [];
            allData.push({
              sessionId: item.sessionId,
              dwellTime: item.dwellTime,
              gazeSamples: cleanedGazeSamples,
              adId: item.adId,
            });
          });
        }
      }

      console.log(`Fetched ${allData.length} session records.`);
      return allData;
    } catch (error) {
      console.error("Error fetching session data by session IDs:", error);
      throw error;
    }
  },

  /**
   * Fetches all sessionIds associated with a specific adId by scanning the table.
   * @param {string} adId - The adId to filter by.
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

        const command = () => dynamoDb.send(new ScanCommand(params));
        const data = await exponentialBackoff(5, command);

        if (data.Items) {
          sessions.push(...data.Items);
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
   * Deletes all analytics session records for a given adId.
   * @param {string} adId - The unique identifier for the ad.
   * @returns {Promise<void>}
   */
  deleteAnalyticsDataByAdId: async function (adId) {
    try {
      console.log(`Deleting analytics data for adId: ${adId}`);
      const sessions = await this.getSessionIdsForAdId(adId);
      console.log(`Found ${sessions.length} analytics sessions for adId: ${adId}`);
      
      for (const session of sessions) {
        const params = {
          TableName: AdAnalyticsTable,
          Key: { 
            sessionId: session.sessionId,
            adId: session.adId,
          },
        };
        await dynamoDb.send(new DeleteCommand(params));
        console.log(`Deleted analytics session ${session.sessionId} for adId: ${adId}`);
      }
    } catch (error) {
      console.error(`Error deleting analytics data for adId: ${adId}:`, error);
      throw error;
    }
  },
};

console.log("AdAnalyticsModel loaded with methods:", Object.keys(AdAnalyticsModel));

module.exports = AdAnalyticsModel;
