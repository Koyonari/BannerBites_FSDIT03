// controllers/websocketController.js

const { getOrCreateSessionData, sessionBuffer } = require("../state/sessionBuffer");
const { persistSessionToDynamo } = require("../services/dynamoService");
const { layoutUpdatesCache, addClient, removeClient } = require("../state");

// This function is called whenever a 'message' event comes in
async function handleWebSocketMessage(ws, message) {
  try {
    const parsedMessage = JSON.parse(message);

    // 1) Subscribe type
    if (parsedMessage.type === "subscribe" && parsedMessage.layoutId) {
      const layoutId = parsedMessage.layoutId;
      addClient(ws, layoutId);

      const cachedData = layoutUpdatesCache[layoutId];
      if (cachedData) {
        ws.send(JSON.stringify({ type: "layoutData", data: cachedData }));
      }
    }
    // 2) Session Start
    else if (parsedMessage.type === "sessionStart") {
      const { sessionId, startTime } = parsedMessage.data;
      const sessionData = getOrCreateSessionData(sessionId);
      sessionData.startTime = startTime || new Date().toISOString();
      console.log("[WS] Session started:", sessionId);
    }
    // 3) Partial Events
    else if (
      parsedMessage.type === "adLookedAt" ||
      parsedMessage.type === "gazeSample"
    ) {
      const { sessionId, ...rest } = parsedMessage.data;
      if (!sessionId) return;
      const sessionData = getOrCreateSessionData(sessionId);

      sessionData.events.push({
        type: parsedMessage.type,
        ...rest,
      });
    }
    // 4) Session End
    else if (parsedMessage.type === "sessionEnd") {
      const { sessionId, endTime } = parsedMessage.data;
      if (!sessionId) return;
      const sessionData = sessionBuffer[sessionId];
      if (sessionData) {
        sessionData.endTime = endTime || new Date().toISOString();

        // Persist
        await persistSessionToDynamo(sessionData);

        // Cleanup
        delete sessionBuffer[sessionId];
        console.log("[WS] Session ended + persisted:", sessionId);
      }
    }
    // 5) Other message types...
  } catch (error) {
    console.error("[WS] Error handling message:", error);
  }
}

module.exports = {
  handleWebSocketMessage,
};
