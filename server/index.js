// index.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const authRoutes = require("./routes/authRoutes");
const adsRoutes = require("./routes/adsRoutes");
const roleRoutes = require("./routes/roleRoutes");
const heatmapRoutes = require("./routes/heatmapRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { handleWebSocketMessage } = require("./controllers/webSocketController");


// Import the state management functions
const { layoutUpdatesCache, addClient, removeClient, broadcastToClients } = require("./state/websocketState");
const { generatePresignedUrlController, fetchLayoutById } = require("./controllers/layoutController");
const { listenToDynamoDbStreams } = require("./middleware/layoutListener");
const { listenToHeatmapStreams } = require("./middleware/heatmapListener");

dotenv.config();

// Create an Express server
const app = express();
// Create an HTTP server using the Express app
const server = http.createServer(app);
// Create a WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });
// Set the port
const PORT = process.env.PORT || 5000;

// Middleware to handle CORS
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
// Middleware to parse JSON data
app.use(express.json());

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);
app.use("/api", authRoutes);
app.post("/generate-presigned-url", generatePresignedUrlController);
app.use('/api/ads', adsRoutes);
app.use('/api/roles', roleRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/dashboard", dashboardRoutes);

// WebSocket Server Handling
wss.on("connection", (ws) => {
  console.log("[BACKEND] New WebSocket connection");
  ws.on("message", (message) => handleWebSocketMessage(ws, message));

  ws.on("close", () => {
    console.log("[BACKEND] WebSocket client disconnected");
    removeClient(ws);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket Server running on port ${PORT}`);
});


(async () => {
  try {
    // Start listening to layout update streams
    await listenToDynamoDbStreams();
    console.log("[LAYOUT] DynamoDB stream listener for layouts initialized.");

    // Start listening to heatmap update streams
    await listenToHeatmapStreams();
    console.log("[HEATMAP] DynamoDB stream listener for heatmaps initialized.");
  } catch (error) {
    console.error("[INIT] Failed to initialize stream listeners:", error);
  }
})();
