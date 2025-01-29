// state/heatmapState.js

const WebSocket = require("ws");

// Store each ws -> { adIds: [] }
const heatmapClients = new Map();

/**
 * Broadcast heatmap data to subscribed WebSocket clients.
 * If a client is watching *any* of the adIds passed in, it receives the update.
 *
 * @param {Array<string>} adIds - Ad IDs that have updated heatmap data.
 * @param {Array} heatmapData - Heatmap data to send to clients.
 */
function broadcastHeatmapUpdate(adIds, heatmapData) {
  heatmapClients.forEach(({ adIds: clientAdIds }, ws) => {
    // If this client has any matching adId in the passed list, broadcast
    const hasMatchingAd = clientAdIds.some((id) => adIds.includes(id));
    if (hasMatchingAd && ws.readyState === WebSocket.OPEN) {
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
 * Adds a new WebSocket client or updates an existing one with multiple adIds.
 * @param {WebSocket} ws - The WebSocket connection.
 * @param {Array<string>} newAdIds - The array of Ad IDs the client wants to subscribe to.
 */
function addHeatmapClient(ws, newAdIds) {
  // If the client already exists, merge adIds
  const existing = heatmapClients.get(ws);
  if (existing) {
    // Combine any existing adIds with the newly subscribed adIds
    const mergedAdIds = [...new Set([...existing.adIds, ...newAdIds])];
    heatmapClients.set(ws, { adIds: mergedAdIds });
    console.log("[HEATMAP] Updated client subscription with adIds:", mergedAdIds);
  } else {
    heatmapClients.set(ws, { adIds: newAdIds });
    console.log(`[HEATMAP] Client subscribed with adIds: ${newAdIds}`);
  }
}

/**
 * Removes a WebSocket client from the heatmap clients list.
 * @param {WebSocket} ws
 */
function removeHeatmapClient(ws) {
  heatmapClients.delete(ws);
  console.log("[HEATMAP] Client removed from heatmapClients.");
}

// Periodically remove any disconnected clients
setInterval(() => {
  heatmapClients.forEach((_, clientWs) => {
    if (clientWs.readyState !== WebSocket.OPEN) {
      console.log("[HEATMAP] Removing disconnected WebSocket client.");
      heatmapClients.delete(clientWs);
    }
  });
}, 30000);

module.exports = {
  broadcastHeatmapUpdate,
  heatmapClients,
  addHeatmapClient,
  removeHeatmapClient,
};
