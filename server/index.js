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

// Endpoint to receive gaze data
app.post("/api/gaze-data", (req, res) => {
  const { gazeData } = req.body;

  if (!Array.isArray(gazeData)) {
    return res.status(400).json({ error: "Invalid data: gazeData must be an array" });
  }

  gazeData.forEach((gazePoint) => {
    const { x, y, timestamp } = gazePoint;

    const gazedAdId = isGazeWithinAd(x, y);
    if (gazedAdId) {
      console.log(`[Gaze Detected] User is viewing ad ${gazedAdId} at time ${timestamp}`);
    } else {
      console.log(`[Gaze Detected] User is not viewing any ad at time ${timestamp}`);
    }
  });

  res.status(200).json({ message: "Gaze data processed successfully" });
});

// Function to determine if a gaze point is within any ad boundary
const isGazeWithinAd = (x, y) => {
  for (let ad of adsBoundaries) {
    const adLeft = ad.topLeftX;
    const adRight = adLeft + ad.width;
    const adTop = ad.topLeftY;
    const adBottom = adTop + ad.height;

    if (x >= adLeft && x <= adRight && y >= adTop && y <= adBottom) {
      return ad.id;
    }
  }
  return null;
};

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
