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

  if (!adId || !sessionId) {
    console.error("[Dynamo] Missing required fields: adId or sessionId. Cannot persist session.");
    return;
  }

  const serializedGazeSamples = Array.isArray(gazeSamples) ? JSON.stringify(gazeSamples) : "[]";

  const item = {
    sessionId: { S: sessionId },
    adId: { S: adId },
    enterTime: { S: enterTime || new Date().toISOString() },
    exitTime: { S: exitTime || new Date().toISOString() },
    dwellTime: { N: (dwellTime || 0).toString() },
    gazeSamples: { S: serializedGazeSamples },
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

    // Update aggregates asynchronously
    updateAdAggregates(adId, dwellTime, gazeSamples.length).catch((error) => {
      console.error(`[Dynamo] Failed to update aggregates for adId: ${adId}:`, error);
    });
  } catch (error) {
    console.error(
      `[Dynamo] Error persisting session (sessionId: ${sessionId}, adId: ${adId}):`,
      error
    );
  }
}

/**
 * Updates aggregated metrics in the AdAggregates table.
 * @param {string} adId
 * @param {number} dwellTime
 * @param {number} gazeSamplesCount
 */
async function updateAdAggregates(adId, dwellTime, gazeSamplesCount) {
  // Ensure dwellTime and gazeSamplesCount are valid numbers
  const validDwellTime = typeof dwellTime === 'number' ? dwellTime : 0;
  const validGazeSamplesCount = typeof gazeSamplesCount === 'number' ? gazeSamplesCount : 0;

  const params = {
    TableName: AD_AGGREGATES_TABLE,
    Key: {
      adId: { S: adId },
    },
    UpdateExpression:
      "ADD totalDwellTime :tdw, totalSessions :ts, totalGazeSamples :tgs SET lastUpdated = :lu",
    ExpressionAttributeValues: {
      ":tdw": { N: validDwellTime.toString() },
      ":ts": { N: "1" },
      ":tgs": { N: validGazeSamplesCount.toString() },
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