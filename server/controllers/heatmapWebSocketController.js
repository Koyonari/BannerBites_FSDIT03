const { heatmapClients } = require("../state/heatmapState");

async function handleHeatmapWebSocketMessage(ws, message) {
  try {
    console.log(`[WS][Heatmap] Raw message received: ${message}`);

    // Parse the incoming message
    const parsedMessage = JSON.parse(message);
    console.log(`[WS][Heatmap] Parsed message:`, parsedMessage);

    // Check the type of message
    if (parsedMessage.type === "subscribeHeatmap") {
      // Validate the adIds
      if (Array.isArray(parsedMessage.adIds)) {
        const { adIds } = parsedMessage;

        // Log subscription details
        console.log(`[WS][Heatmap] Subscribing client to adIds: ${adIds}`);

        // Map WebSocket client to adIds
        heatmapClients.set(ws, { adIds });

        // Confirm the subscription has been recorded
        console.log(
          `[WS][Heatmap] Subscription recorded. Total clients subscribed: ${heatmapClients.size}`
        );
      } else {
        console.warn(
          "[WS][Heatmap] Received subscribeHeatmap message, but 'adIds' is not a valid array:",
          parsedMessage.adIds
        );
      }
    } else {
      console.warn("[WS][Heatmap] Invalid or unhandled message type:", parsedMessage.type);
    }
  } catch (error) {
    console.error("[WS][Heatmap] Error handling message:", error);
  }
}

module.exports = {
  handleHeatmapWebSocketMessage,
};
