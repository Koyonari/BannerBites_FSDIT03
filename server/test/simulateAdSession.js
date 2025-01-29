const WebSocket = require("ws");

const simulateAdSession = async () => {
  const ws = new WebSocket("ws://localhost:5000");

  ws.on("open", () => {
    console.log("[WS] Connected to WebSocket server");

    // Step 1: Subscribe to heatmap for a specific adId
    const adId = "9df2c425-c2f9-4235-9a85-647b934b54b4"; // Example adId
    const subscribeMessage = {
      type: "subscribeHeatmap",
      adIds: [adId],
    };
    ws.send(JSON.stringify(subscribeMessage));
    console.log("[WS] Sent subscription message:", subscribeMessage);

    // Step 2: Start the session
    const sessionId = `adSession-${Date.now()}`;
    const sessionStartMessage = {
      type: "sessionStart",
      data: {
        sessionId: sessionId,
        startTime: new Date().toISOString(),
        adId: adId, // Explicitly include adId
      },
    };
    ws.send(JSON.stringify(sessionStartMessage));
    console.log("[WS] Sent sessionStart message:", sessionStartMessage);

    // Step 3: Send gazeSamples
    const gazeSamples = [
      { x: 0.45, y: 0.55, timestamp: Date.now(), value: 1 },
      { x: 0.55, y: 0.65, timestamp: Date.now() + 1000, value: 1 },
    ];

    gazeSamples.forEach((sample) => {
      const gazeSampleMessage = {
        type: "gazeSample",
        data: {
          sessionId: sessionId,
          ...sample,
        },
      };
      ws.send(JSON.stringify(gazeSampleMessage));
      console.log("[WS] Sent gazeSample message:", gazeSampleMessage);
    });

    // Step 4: End the session
    setTimeout(() => {
      const sessionEndMessage = {
        type: "sessionEnd",
        data: {
          sessionId: sessionId,
          endTime: new Date().toISOString(),
        },
      };
      ws.send(JSON.stringify(sessionEndMessage));
      console.log("[WS] Sent sessionEnd message:", sessionEndMessage);

      // Close the WebSocket connection
      ws.close();
      console.log("[WS] WebSocket connection closed.");
    }, 2000); // Delay to simulate session duration
  });

  ws.on("message", (message) => {
    console.log("[WS] Received message from server:", message);
  });

  ws.on("error", (error) => {
    console.error("[WS] WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("[WS] WebSocket connection closed.");
  });
};

// Run the simulation
simulateAdSession();
