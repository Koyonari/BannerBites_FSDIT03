// controllers/websocketController.js

const {
  getOrCreateSessionData,
  sessionBuffer,
} = require("../state/sessionBuffer");
const { persistSessionToDynamo } = require("../services/dynamoService");
const { layoutUpdatesCache, addClient, removeClient } = require("../state");

// This function is called whenever a 'message' event comes in
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

      // Check if we have an entry in the Map
      if (sessionMap.has(sessionId)) {
        const sessionData = sessionMap.get(sessionId);
        sessionData.endTime = endTime || new Date().toISOString();

        // Persist the complete session
        await persistSessionToDynamo(sessionData);

        // Remove from memory
        sessionMap.delete(sessionId);
        console.log("[WS] Session ended + persisted:", sessionId);
      }
    }
    // 5) Handle "adSessionComplete"
    else if (parsedMessage.type === "adSessionComplete") {
      const { adSessionId, adId, enterTime, exitTime, dwellTime, gazeSamples } =
        parsedMessage.data;

      // We could create a small object for the session:
      const sessionObj = {
        adSessionId,
        enterTime,
        exitTime,
        dwellTime,
        gazeSamples,
        // Possibly add user info or sessionId if you want
      };

      // Attempt to update Dynamo with concurrency checks
      // appendAdSessions can handle multiple sessions at once,
      // so we pass an array of 1 item here:
      await appendAdSessions(adId, [sessionObj]);

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
