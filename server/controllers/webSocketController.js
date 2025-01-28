// controllers/websocketController.js

const {
  getOrCreateSessionData,
  sessionMap,
} = require("../state/sessionBuffer");
const { persistSessionToDynamo } = require("../services/dynamoService");
const { layoutUpdatesCache, addClient, removeClient } = require("../state");

/**
 * Handles incoming WebSocket messages.
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {string} message - The received message.
 */
async function handleWebSocketMessage(ws, message) {
  try {
    const parsedMessage = JSON.parse(message);

    // 1) Subscribe
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

      sessionData.enterTime = startTime || new Date().toISOString();
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
      sessionData.gazeSamples.push({
        type: parsedMessage.type,
        ...rest,
      });
    }

    // 4) Session End
    else if (parsedMessage.type === "sessionEnd") {
      const { sessionId, endTime } = parsedMessage.data;
      if (!sessionId) return;

      // Check if we have an entry in the Map
      if (sessionMap.has(sessionId)) {
        const sessionData = sessionMap.get(sessionId);
        sessionData.exitTime = endTime || new Date().toISOString();

        // Persist the complete session
        await persistSessionToDynamo(sessionData);

        // Remove from memory
        sessionMap.delete(sessionId);
        console.log("[WS] Session ended + persisted:", sessionId);
      }
    }

    // 5) Handle "adSessionComplete"
    else if (parsedMessage.type === "adSessionComplete") {
      const {
        adSessionId: sessionId,
        adId,
        enterTime,
        exitTime,
        dwellTime,
        gazeSamples,
      } = parsedMessage.data;

      if (!sessionId || !adId) {
        console.warn("[WS] Missing sessionId or adId in adSessionComplete message.");
        return;
      }

      // Create or retrieve existing session data
      const sessionData = getOrCreateSessionData(sessionId);
      sessionData.adId = adId;
      sessionData.enterTime = enterTime || new Date().toISOString();
      sessionData.exitTime = exitTime || new Date().toISOString();
      sessionData.dwellTime = dwellTime || 0;
      sessionData.gazeSamples = gazeSamples || [];

      // Persist the session data
      await persistSessionToDynamo(sessionData);

      // Remove from memory
      sessionMap.delete(sessionId);

      console.log("[WS] adSessionComplete stored in Dynamo for adId:", adId);
    } else {
      console.warn("[WS] Unhandled message type:", parsedMessage.type);
    }
  } catch (error) {
    console.error("[WS] Error handling message:", error);
  }
}

module.exports = {
  handleWebSocketMessage,
};
