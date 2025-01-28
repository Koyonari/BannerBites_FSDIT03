// services/dynamoService.js

const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-southeast-1" });

const AD_ANALYTICS_TABLE = "AdAnalytics";
const AD_AGGREGATES_TABLE = "AdAggregates";

/**
 * Persists a session to the AdAnalytics DynamoDB table.
 * @param {Object} sessionData - The session data to persist.
 */
async function persistSessionToDynamo(sessionData) {
  const { sessionId, adId, enterTime, exitTime, dwellTime, gazeSamples } = sessionData;

  // Validate required fields
  if (!sessionId || !adId) {
    console.error("Missing sessionId or adId. Cannot persist to DynamoDB.", { sessionId, adId });
    return;
  }

  // Validate dwellTime
  if (typeof dwellTime !== 'number' || isNaN(dwellTime)) {
    console.error("Invalid dwellTime. Cannot persist to DynamoDB.", { dwellTime });
    return;
  }

  // Validate gazeSamples
  if (!gazeSamples || typeof gazeSamples !== 'string') {
    console.error("Invalid gazeSamples. Cannot persist to DynamoDB.", { gazeSamples });
    return;
  }

  const item = {
    sessionId: { S: sessionId },
    adId: { S: adId },
    enterTime: { S: enterTime || "" },
    exitTime: { S: exitTime || "" },
    dwellTime: { N: dwellTime.toString() },
    gazeSamples: { S: gazeSamples },
    lastUpdated: { S: new Date().toISOString() },
  };

  try {
    await client.send(
      new PutItemCommand({
        TableName: AD_ANALYTICS_TABLE,
        Item: item,
      })
    );

    console.log("Successfully inserted session data into AdAnalytics", { sessionId, adId, gazeSamplesCount: JSON.parse(gazeSamples).length });

    // Update aggregates
    await updateAdAggregates(adId, dwellTime, JSON.parse(gazeSamples).length);
  } catch (error) {
    console.error("Error persisting session data to DynamoDB", { error, sessionId, adId });
  }
}

/**
 * Updates the AdAggregates table with new session data.
 * @param {string} adId - The ad identifier.
 * @param {number} dwellTime - The dwell time in milliseconds.
 * @param {number} gazeSampleCount - The number of gaze samples.
 */
async function updateAdAggregates(adId, dwellTime, gazeSampleCount) {
  if (!adId) {
    console.error("Missing adId. Cannot update AdAggregates.", { adId });
    return;
  }

  try {
    await client.send(
      new UpdateItemCommand({
        TableName: AD_AGGREGATES_TABLE,
        Key: {
          adId: { S: adId },
        },
        UpdateExpression:
          "SET totalDwellTime = if_not_exists(totalDwellTime, :start) + :dwellTime, " +
          "totalGazeSamples = if_not_exists(totalGazeSamples, :start) + :gazeSampleCount, " +
          "totalSessions = if_not_exists(totalSessions, :start) + :one, " +
          "lastUpdated = :lastUpdated",
        ExpressionAttributeValues: {
          ":dwellTime": { N: dwellTime.toString() },
          ":gazeSampleCount": { N: gazeSampleCount.toString() },
          ":one": { N: "1" },
          ":lastUpdated": { S: new Date().toISOString() },
          ":start": { N: "0" },
        },
      })
    );

    console.log("Successfully updated AdAggregates", { adId, dwellTime, gazeSampleCount });
  } catch (error) {
    console.error("Error updating AdAggregates in DynamoDB", { error, adId });
  }
}

module.exports = {
  persistSessionToDynamo,
};
