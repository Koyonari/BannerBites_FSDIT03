// index.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { layoutUpdatesCache, addClient, removeClient, broadcastToClients } = require("./state");
const { generatePresignedUrlController, fetchLayoutById } = require("./controllers/layoutController");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const bodyParser = require("body-parser");

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
app.use(bodyParser.json());

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);
app.post("/generate-presigned-url", generatePresignedUrlController);

// API endpoint to receive viewer data
app.post('/api/viewerData', (req, res) => {
  // Log the entire request body for debugging
  console.log('Viewer Data Received:', req.body);

  // Destructure the expected fields from the request body
  const { layoutId, looking, timestamp } = req.body;

  // Basic Validation
  if (
    typeof layoutId !== 'string' ||
    typeof looking !== 'boolean' ||
    typeof timestamp !== 'string' ||
    isNaN(Date.parse(timestamp))
  ) {
    console.warn('Invalid data format received:', req.body);
    return res.status(400).json({ error: 'Invalid data format' });
  }

  // Log formatted data
  console.log(`Viewer Data:
    Layout ID: ${layoutId}
    Looking: ${looking}
    Timestamp: ${timestamp}
  `);

  // Respond to the client
  res.status(200).json({ message: 'Viewer data logged successfully' });
});

// WebSocket Server Handling
wss.on("connection", (ws) => {
  console.log("[BACKEND] New WebSocket connection established");

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "subscribe" && parsedMessage.layoutId) {
        const layoutId = parsedMessage.layoutId;

        // Add client to the state
        addClient(ws, layoutId);

        // Send cached data if available
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

    // Remove the disconnected client from the clients list
    removeClient(ws);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`HTTP/WebSocket Server running on port ${PORT}`);
});


// Listen to DynamoDB streams
listenToDynamoDbStreams();
