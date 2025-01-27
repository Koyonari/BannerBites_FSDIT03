// services/dynamoService.js
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = "EyeTrackingSessions";

async function persistSessionToDynamo(sessionData) {
  const { sessionId, startTime, endTime, events } = sessionData;
  console.log("[Dynamo] Persisting session:", sessionId);

  const item = {
    sessionId: { S: sessionId },
    startTime: { S: startTime || "" },
    endTime:   { S: endTime || "" },
    events:    { S: JSON.stringify(events) },
  };

  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  console.log(
    "[Dynamo] Inserted session:",
    sessionId,
    "with event count:",
    events.length
  );
}

module.exports = {
  persistSessionToDynamo,
};
