// controllers/heatmapWebSocketController.js
const { heatmapClients, addHeatmapClient, broadcastHeatmapUpdate } = require("../state/heatmapState");

/**
 * Handle incoming WebSocket messages specifically for heatmap functionality:
 * - subscribeHeatmap
 * - sessionHeatmapUpdate (if you want to push partial updates from a client)
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {string} message - The raw message string
 */
async function handleHeatmapWebSocketMessage(ws, message) {
  try {
    console.log(`[WS][Heatmap] Raw message received: ${message}`);

    const parsedMessage = JSON.parse(message);
    console.log(`[WS][Heatmap] Parsed message:`, parsedMessage);

    const { type } = parsedMessage;

    switch (type) {
      case "subscribeHeatmap":
        // Example payload: { type: "subscribeHeatmap", adIds: ["adId1", "adId2"] }
        if (Array.isArray(parsedMessage.adIds) && parsedMessage.adIds.length > 0) {
          addHeatmapClient(ws, parsedMessage.adIds);
        } else {
          console.warn("[WS][Heatmap] No valid adIds in subscribeHeatmap message:", parsedMessage);
        }
        break;

      case "sessionHeatmapUpdate":
        // If your client is sending partial updates with new points
        // E.g. { type: "sessionHeatmapUpdate", data: { adId, points: [...] } }
        if (parsedMessage.data && parsedMessage.data.adId && parsedMessage.data.points) {
          const { adId, points } = parsedMessage.data;
          // You might want to persist these points or store them in a DB.
          console.log(`[WS][Heatmap] Received partial heatmap update for adId=${adId}`);

          // Then broadcast the update to all watchers for adId
          broadcastHeatmapUpdate([adId], points);
        }
        break;

      default:
        console.warn("[WS][Heatmap] Unhandled or invalid message type:", type);
        break;
    }
  } catch (error) {
    console.error("[WS][Heatmap] Error handling message:", error);
  }
}

module.exports = {
  handleHeatmapWebSocketMessage,
};
