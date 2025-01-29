// state/aggregatesState.js

const Clients = new Map(); // Map of adId to Set of WebSocket clients

function addAggregateClient(ws, adIds) {
  adIds.forEach((adId) => {
    if (!Clients.has(adId)) {
      Clients.set(adId, new Set());
    }
    Clients.get(adId).add(ws);
  });
}

function removeAggregateClient(ws, adIds) {
  adIds.forEach((adId) => {
    if (Clients.has(adId)) {
      Clients.get(adId).delete(ws);
      if (Clients.get(adId).size === 0) {
        Clients.delete(adId);
      }
    }
  });
}

function broadcastAggregateUpdate(adId, newAggregateData) {
  if (!Clients.has(adId)) return;
  for (const clientWs of Clients.get(adId)) {
    if (clientWs.readyState === 1) {
      const payload = {
        type: "aggregatesUpdate", // Ensure this is 'aggregatesUpdate'
        data: {
          adId,
          ...newAggregateData,
        },
      };
      clientWs.send(JSON.stringify(payload));
    }
  }
}

module.exports = {
  addAggregateClient,
  removeAggregateClient,
  broadcastAggregateUpdate,
};
