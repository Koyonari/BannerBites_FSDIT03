// state/heatmapState.js

const WebSocket = require("ws");

// WebSocket clients list for heatmap updates
const heatmapClients = new Map();

// // Mock Heatmap Data Broadcasting
// setInterval(() => {
//   // Generate mock heatmap data
//   const mockHeatmapData = Array.from({ length: 10 }, () => ({
//     x: Math.random() * 500, // Random x-coordinate
//     y: Math.random() * 500, // Random y-coordinate
//     value: Math.random() * 10, // Random value for heat intensity
//   }));

//   // Broadcast mock data to all subscribed clients for this adId
//   const mockAdIds = ["8a104d1e-d704-44a0-9a9d-c4c35662fce4"]; // Replace with real or multiple IDs
//   console.log("[Backend] Broadcasting mock heatmap data:", mockHeatmapData);

//   broadcastHeatmapUpdate(mockAdIds, mockHeatmapData); // Ensure `broadcastHeatmapUpdate` works
// }, 5000); // Broadcast every 5 seconds

/**
 * Broadcast heatmap data to subscribed WebSocket clients.
 * @param {Array} adIds - List of ad IDs to broadcast the update for.
 * @param {Array} heatmapData - Heatmap data to send to clients.
 */
function broadcastHeatmapUpdate(adIds, heatmapData) {
  heatmapClients.forEach((client, ws) => {
    if (client.adIds && client.adIds.some((adId) => adIds.includes(adId))) {
      const payload = {
        type: "heatmapUpdate",
        data: heatmapData,
      };
      ws.send(JSON.stringify(payload));
      console.log("[Backend] Sent heatmap update to client:", payload);
    }
  });
}

/**
 * Adds a new WebSocket client to the heatmap clients list.
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {string} adId - The ad ID that the client is subscribing to.
 */
function addHeatmapClient(ws, adId) { // Changed parameter from layoutId to adId
  heatmapClients.set(ws, { adId }); // Set adId instead of layoutId
  console.log(`[HEATMAP] Client subscribed with adId: ${adId}`);
}

/**
 * Removes a WebSocket client from the heatmap clients list.
 * @param {WebSocket} ws - The WebSocket connection.
 */
function removeHeatmapClient(ws) {
  heatmapClients.delete(ws);
  console.log("[HEATMAP] Client removed from heatmapClients.");
}

// Periodically clear disconnected clients
setInterval(() => {
  heatmapClients.forEach((_, clientWs) => {
    if (clientWs.readyState !== WebSocket.OPEN) {
      console.log("[HEATMAP] Removing disconnected WebSocket client.");
      heatmapClients.delete(clientWs);
    }
  });
}, 30000); // Run every 30 seconds

module.exports = {
  broadcastHeatmapUpdate,
  heatmapClients, // Export heatmapClients for direct access if needed
  addHeatmapClient,
  removeHeatmapClient,
};
