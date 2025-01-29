// state.js

// This file manages the shared state between different parts of the application.

// Holds the cached layout updates to minimize database hits
const layoutUpdatesCache = {};

// WebSocket clients list (using a Map to store metadata about each client connection)
const clients = new Map();

/**
 * Adds a new client to the clients list.
 * @param {WebSocket} ws - The WebSocket connection of the client.
 * @param {string} layoutId - The layout ID that the client is subscribing to.
 */
function addClient(ws, layoutId) {
  clients.set(ws, { layoutId });
}

/**
 * Removes a client from the clients list.
 * @param {WebSocket} ws - The WebSocket connection of the client to be removed.
 */
function removeClient(ws) {
  clients.delete(ws);
}

/**
 * Broadcasts a message to all clients subscribed to a particular layout ID.
 * @param {string} layoutId - The layout ID to broadcast to.
 * @param {object} message - The message to be sent.
 */
function broadcastToClients(layoutId, message) {
  clients.forEach((clientData, clientWs) => {
    if (clientWs.readyState === clientWs.OPEN && clientData.layoutId === layoutId) {
      try {
        clientWs.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[BACKEND] Error broadcasting to client for layoutId: ${layoutId}`, error);
      }
    }
  });
}

// Periodically clear disconnected clients
setInterval(() => {
  clients.forEach((clientData, clientWs) => {
    if (clientWs.readyState !== clientWs.OPEN) {
      console.log("[BACKEND] Removing client due to closed or invalid WebSocket.");
      clients.delete(clientWs);
    }
  });
}, 30000); // Run every 30 seconds

module.exports = {
  layoutUpdatesCache,
  clients,
  addClient,
  removeClient,
  broadcastToClients,
};
