// server.js (Your main server file)

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { listenToDynamoDbStreams, broadcastLayoutUpdate } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const state = require("./state");
const { generatePresignedUrlController, fetchLayoutById } = require("./controllers/layoutController");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);
app.post("/generate-presigned-url", generatePresignedUrlController);

// WebSocket Server Handling
wss.on("connection", (ws) => {
  console.log("[BACKEND] New WebSocket connection established");

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "subscribe" && parsedMessage.layoutId) {
        ws.layoutId = parsedMessage.layoutId;
        state.clients.push(ws);

        // Send cached data if available
        const layoutId = parsedMessage.layoutId;
        const cachedData = layoutUpdatesCache[layoutId];
        if (cachedData) {
          ws.send(JSON.stringify({ type: "layoutData", data: cachedData }));
        }
      }
    } catch (error) {
      console.error("[BACKEND] Error handling WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("[BACKEND] WebSocket client disconnected");
    state.clients = state.clients.filter(client => client !== ws);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket Server running on port ${PORT}`);
});

// Listen to DynamoDB streams
listenToDynamoDbStreams();
