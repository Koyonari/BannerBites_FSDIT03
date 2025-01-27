// services/dynamoService.js

const { DynamoDBClient, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const AD_ANALYTICS_TABLE = "AdAnalytics";
const AD_AGGREGATES_TABLE = "AdAggregates";

/**
 * Persists a session to the AdAnalytics table.
 * @param {object} sessionData
 */
async function persistSessionToDynamo(sessionData) {
  const { sessionId, adId, enterTime, exitTime, dwellTime, gazeSamples } = sessionData;
  console.log("[Dynamo] Persisting session:", sessionId, "for adId:", adId);

  const item = {
    sessionId: { S: sessionId },
    adId: { S: adId },
    enterTime: { S: enterTime || "" },
    exitTime: { S: exitTime || "" },
    dwellTime: { N: dwellTime.toString() },
    gazeSamples: { S: JSON.stringify(gazeSamples) },
    lastUpdated: { S: new Date().toISOString() },
  };

  try {
    await client.send(
      new PutItemCommand({
        TableName: AD_ANALYTICS_TABLE,
        Item: item,
      })
    );

    console.log(
      "[Dynamo] Inserted session:",
      sessionId,
      "for adId:",
      adId,
      "with gaze samples count:",
      gazeSamples.length
    );

    // Update aggregates
    await updateAdAggregates(adId, dwellTime, gazeSamples.length);
  } catch (error) {
    console.error("[Dynamo] Error persisting session:", error);
  }
}

/**
 * Updates aggregated metrics in the AdAggregates table.
 * @param {string} adId
 * @param {number} dwellTime
 * @param {number} gazeSamplesCount
 */
async function updateAdAggregates(adId, dwellTime, gazeSamplesCount) {
  const params = {
    TableName: AD_AGGREGATES_TABLE,
    Key: {
      adId: { S: adId },
    },
    UpdateExpression:
      "ADD totalDwellTime :tdw, totalSessions :ts, totalGazeSamples :tgs SET lastUpdated = :lu",
    ExpressionAttributeValues: {
      ":tdw": { N: dwellTime.toString() },
      ":ts": { N: "1" },
      ":tgs": { N: gazeSamplesCount.toString() },
      ":lu": { S: new Date().toISOString() },
    },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`[Dynamo] Updated aggregates for adId: ${adId}`);
  } catch (error) {
    console.error(`[Dynamo] Error updating aggregates for adId: ${adId}:`, error);
  }
}

module.exports = {
  persistSessionToDynamo,
};
