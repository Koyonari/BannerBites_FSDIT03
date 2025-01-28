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
    console.log(`[WS] Received message: ${message}`);

    // 1) Subscribe
    if (parsedMessage.type === "subscribe" && parsedMessage.layoutId) {
      const layoutId = parsedMessage.layoutId;
      addClient(ws, layoutId);
      console.log(`[WS] Client subscribed to layoutId: ${layoutId}`);

      const cachedData = layoutUpdatesCache[layoutId];
      if (cachedData) {
        ws.send(JSON.stringify({ type: "layoutData", data: cachedData }));
        console.log(`[WS] Sent cached layoutData for layoutId: ${layoutId}`);
      }
    }

    // 2) Session Start
    else if (parsedMessage.type === "sessionStart") {
      const { sessionId, startTime } = parsedMessage.data;
      const sessionData = getOrCreateSessionData(sessionId);

      sessionData.enterTime = startTime || new Date().toISOString();
      console.log(`[WS] Session started: sessionId=${sessionId}, enterTime=${sessionData.enterTime}`);

      // Additional Logging: Log initial session data
      console.log(`[WS] Initial session data:`, sessionData);
    }

    // 3) Partial Events
    else if (
      parsedMessage.type === "adLookedAt" ||
      parsedMessage.type === "gazeSample"
    ) {
      const { sessionId, ...rest } = parsedMessage.data;
      if (!sessionId) {
        console.warn("[WS] Received partial event without sessionId:", parsedMessage.data);
        return;
      }

      const sessionData = getOrCreateSessionData(sessionId);
      sessionData.gazeSamples.push({
        type: parsedMessage.type,
        ...rest,
      });

      console.log(`[WS] Received partial event: type=${parsedMessage.type}, sessionId=${sessionId}`);
      console.log(`[WS] Updated session data for sessionId=${sessionId}:`, sessionData);
    }

    // 4) Session End
    else if (parsedMessage.type === "sessionEnd") {
      const { sessionId, endTime } = parsedMessage.data;
      if (!sessionId) {
        console.warn("[WS] Received sessionEnd without sessionId:", parsedMessage.data);
        return;
      }

      // Check if we have an entry in the Map
      if (sessionMap.has(sessionId)) {
        const sessionData = sessionMap.get(sessionId);
        sessionData.exitTime = endTime || new Date().toISOString();

        // Parse enterTime and exitTime to Date objects
        const enterTimestamp = new Date(sessionData.enterTime).getTime();
        const exitTimestamp = new Date(sessionData.exitTime).getTime();

        // Calculate dwellTime in milliseconds
        sessionData.dwellTime = exitTimestamp - enterTimestamp;

        console.log(`[WS] Session ended: sessionId=${sessionId}, exitTime=${sessionData.exitTime}, dwellTime=${sessionData.dwellTime}ms`);

        // Persist the complete session
        await persistSessionToDynamo(sessionData);
        console.log(`[WS] Persisted session data for sessionId=${sessionId} to DynamoDB`);

        // Remove from memory
        sessionMap.delete(sessionId);
        console.log(`[WS] Removed sessionId=${sessionId} from sessionMap`);
      } else {
        console.warn(`[WS] sessionEnd received for unknown sessionId=${sessionId}`);
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
        console.warn("[WS] Missing sessionId or adId in adSessionComplete message:", parsedMessage.data);
        return;
      }

      // Create or retrieve existing session data
      const sessionData = getOrCreateSessionData(sessionId);
      sessionData.adId = adId;
      sessionData.enterTime = enterTime || new Date().toISOString();
      sessionData.exitTime = exitTime || new Date().toISOString();
      sessionData.dwellTime = dwellTime || 0;
      sessionData.gazeSamples = gazeSamples || [];

      console.log(`[WS] Handling adSessionComplete: sessionId=${sessionId}, adId=${adId}`);
      console.log(`[WS] Session data before persisting:`, sessionData);

      // Persist the session data
      await persistSessionToDynamo(sessionData);
      console.log(`[WS] Persisted adSessionComplete data for sessionId=${sessionId}, adId=${adId} to DynamoDB`);

      // Remove from memory
      sessionMap.delete(sessionId);
      console.log(`[WS] Removed adSessionComplete sessionId=${sessionId} from sessionMap`);
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
