// controllers/websocketController.js

const {
  getOrCreateSessionData,
  sessionMap,
} = require("../state/sessionBuffer");
const { persistSessionToDynamo } = require("../services/dynamoService");
const { layoutUpdatesCache, addClient, removeClient } = require("../state/websocketState");
const { handleHeatmapWebSocketMessage } = require("./heatmapWebSocketController"); // Import the heatmap handler
const { addAggregateClient } = require("../state/aggregatesState");

/**
 * Handles incoming WebSocket messages.
 * Routes messages to appropriate handlers based on message type.
 *
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {string} message - The received message.
 */
async function handleWebSocketMessage(ws, message) {
  try {
    const parsedMessage = JSON.parse(message);
    console.log(`[WS] Received message: ${message}`);

    const { type } = parsedMessage;

    // Route heatmap-specific messages to their handler
    if (type === "subscribeHeatmap" || type === "sessionHeatmapUpdate") {
      await handleHeatmapWebSocketMessage(ws, message);
      return; // Exit after handling to prevent further processing
    }

    // Handle other message types
    switch (type) {
      case "subscribe":
        await handleSubscribe(ws, parsedMessage);
        break;

      case "sessionStart":
        await handleSessionStart(parsedMessage);
        break;

      case "adLookedAt":
      case "gazeSample":
        await handlePartialEvent(parsedMessage);
        break;

      case "sessionEnd":
        await handleSessionEnd(parsedMessage);
        break;

      case "adSessionComplete":
        await handleAdSessionComplete(parsedMessage);
        break;

      case "subscribeAdAggregates":
      if (Array.isArray(parsedMessage.adIds) && parsedMessage.adIds.length > 0) {
        addAggregateClient(ws, parsedMessage.adIds);
      }

      break;
      default:
        console.warn("[WS] Unhandled message type:", type);
    }
  } catch (error) {
    console.error("[WS] Error handling message:", error);
  }
}

/**
 * Handles the "subscribe" message type.
 *
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {Object} message - The parsed message object.
 */
async function handleSubscribe(ws, message) {
  const { layoutId } = message;
  if (!layoutId) {
    console.warn("[WS] Missing layoutId in subscribe message.");
    return;
  }

  addClient(ws, layoutId);
  console.log(`[WS] Client subscribed to layoutId: ${layoutId}`);

  const cachedData = layoutUpdatesCache[layoutId];
  if (cachedData) {
    ws.send(JSON.stringify({ type: "layoutData", data: cachedData }));
    console.log(`[WS] Sent cached layoutData for layoutId: ${layoutId}`);
  }
}

/**
 * Handles the "sessionStart" message type.
 *
 * @param {Object} message - The parsed message object.
 */
async function handleSessionStart(message) {
  const { sessionId, startTime, adId } = message.data; // Include adId
  if (!sessionId) {
    console.warn("[WS] Missing sessionId in sessionStart message.");
    return;
  }

  const sessionData = getOrCreateSessionData(sessionId);
  sessionData.enterTime = startTime || new Date().toISOString();
  sessionData.adId = adId || sessionData.adId || "unknown-ad"; // Ensure adId is set
  console.log(`[WS] Session started: sessionId=${sessionId}, adId=${sessionData.adId}, enterTime=${sessionData.enterTime}`);

  // Additional Logging: Log initial session data
  console.log(`[WS] Initial session data:`, sessionData);
}

/**
 * Handles partial event messages like "adLookedAt" and "gazeSample".
 *
 * @param {Object} message - The parsed message object.
 */
async function handlePartialEvent(message) {
  const { type, data } = message;
  const { sessionId, ...rest } = data;

  if (!sessionId) {
    console.warn(`[WS] Received ${type} event without sessionId:`, data);
    return;
  }

  const sessionData = getOrCreateSessionData(sessionId);
  sessionData.gazeSamples.push({
    type: type,
    ...rest,
  });

  console.log(`[WS] Received partial event: type=${type}, sessionId=${sessionId}`);
  console.log(`[WS] Updated session data for sessionId=${sessionId}:`, sessionData);
}

/**
 * Handles the "sessionEnd" message type.
 *
 * @param {Object} message - The parsed message object.
 */
async function handleSessionEnd(message) {
  const { sessionId, endTime } = message.data;
  if (!sessionId) {
    console.warn("[WS] Received sessionEnd without sessionId:", message.data);
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

/**
 * Handles the "adSessionComplete" message type.
 *
 * @param {Object} message - The parsed message object.
 */
async function handleAdSessionComplete(message) {
  const {
    adSessionId: sessionId,
    adId,
    enterTime,
    exitTime,
    dwellTime,
    gazeSamples,
  } = message.data;

  if (!sessionId || !adId) {
    console.warn("[WS] Missing sessionId or adId in adSessionComplete message:", message.data);
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
}

module.exports = {
  handleWebSocketMessage,
};
