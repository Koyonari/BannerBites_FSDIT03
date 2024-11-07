// index.js

const cors = require("cors");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController, getLayoutById } = require("./controllers/layoutController");
const http = require("http");
const WebSocket = require("ws");

dotenv.config();

const express = require("express");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WEBSOCKET_PORT || 6000;  // New WebSocket port

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Adjust for production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);
// Endpoint to get recent layout updates
app.get("/api/layout-updates/:layoutId", (req, res) => {
  const layoutId = req.params.layoutId;
  const updatedLayout = layoutUpdatesCache[layoutId];
  
  if (updatedLayout) {
    return res.json(updatedLayout);
  } else {
    return res.status(404).json({ message: "No updates available for the requested layout." });
  }
});

// Generate presigned URL route
app.post("/generate-presigned-url", generatePresignedUrlController);

// Start the HTTP server for REST API
server.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// Create a new WebSocket server on a separate port
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (ws, req) => {
  console.log("[BACKEND] New WebSocket client connected from:", req.socket.remoteAddress);

  // Manage heartbeat to detect stale connections
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));

  // Heartbeat interval to detect stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping(() => {});
    });
  }, 30000); // Run every 30 seconds

  ws.on("close", () => {
    console.log("[BACKEND] WebSocket client disconnected");
    clearInterval(interval); // Clear interval on disconnect
  });

  ws.on("error", (error) => {
    console.error("[BACKEND] WebSocket error:", error);
  });
});

// Modify listenToDynamoDbStreams to save updates to cache
listenToDynamoDbStreams((update) => {
  const { type, data } = update;
  
  // Only store layout updates in the cache
  if (type === "layoutUpdate" || type === "layoutData") {
    layoutUpdatesCache[data.layoutId] = data;
    console.log(`[BACKEND] Cached updated layout for layoutId: ${data.layoutId}`);
  }
});

console.log(`WebSocket server running on port ${WS_PORT}`);
