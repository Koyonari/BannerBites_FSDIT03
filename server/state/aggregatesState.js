// state/aggregatesState.js
const aggregateClients = new Map(); 
// e.g. Map<WebSocket, { adIds: string[] }>

function addAggregateClient(ws, adIds) {
  aggregateClients.set(ws, { adIds });
  console.log("[Aggregates] Client subscribed to adIds:", adIds);
}

function removeAggregateClient(ws) {
  aggregateClients.delete(ws);
}

function broadcastAggregateUpdate(adId, newAggregateData) {
  // Send an “aggregatesUpdate” message only to clients subscribed to this adId
  for (const [clientWs, { adIds }] of aggregateClients.entries()) {
    if (adIds.includes(adId) && clientWs.readyState === 1) {
      const payload = {
        type: "aggregatesUpdate",
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
