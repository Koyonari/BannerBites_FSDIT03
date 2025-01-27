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
const { handleWebSocketMessage } = require("./controllers/webSocketController");

// Import the state management functions
const { layoutUpdatesCache, addClient, removeClient, broadcastToClients } = require("./state");
const { generatePresignedUrlController, fetchLayoutById } = require("./controllers/layoutController");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");

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
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);
app.use("/api", authRoutes);
app.post("/generate-presigned-url", generatePresignedUrlController);
app.use('/api/ads', adsRoutes);
app.use('/api/roles', roleRoutes);

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


// Listen to DynamoDB streams
listenToDynamoDbStreams();
