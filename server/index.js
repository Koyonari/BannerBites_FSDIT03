const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController, getLayoutById  } = require("./controllers/layoutController");
const http = require("http");
const WebSocket = require("ws");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with frontend's URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/layouts", layoutRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/tvs", tvRoutes);

// Generate presigned URL route
app.post("/generate-presigned-url", generatePresignedUrlController);

// Create an HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("New WebSocket connection established");

  // Listen for messages from the client
  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      // Handle the "getLayout" message type
      if (parsedMessage.type === "getLayout" && parsedMessage.layoutId) {
        const layout = await getLayoutByIdFromController(parsedMessage.layoutId);
        ws.send(JSON.stringify({ type: "layoutData", data: layout }));
      }

      // Add other message types as needed
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      ws.send(JSON.stringify({ type: "error", message: "Invalid request format" }));
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Helper function to get layout by ID
const getLayoutByIdFromController = async (layoutId) => {
  try {
    const layout = await LayoutModel.getLayoutById(layoutId);
    if (!layout) {
      return { error: "Layout not found" };
    }
    // Get grid items and associated ads
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    for (const item of gridItems) {
      const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(`${layoutId}#${item.index}`);
      for (const scheduledAd of scheduledAds) {
        const ad = await AdModel.getAdById(scheduledAd.adId);
        scheduledAd.ad = ad;
      }
      item.scheduledAds = scheduledAds;
    }
    layout.gridItems = gridItems;
    return layout;
  } catch (error) {
    console.error("Error fetching layout data:", error);
    return { error: "Internal server error" };
  }
};

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
