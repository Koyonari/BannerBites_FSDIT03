const cors = require("cors");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const state = require("./state");
const { generatePresignedUrlController, getLayoutById, fetchLayoutById } = require("./controllers/layoutController");


dotenv.config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

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

// Generate presigned URL route
app.post("/generate-presigned-url", generatePresignedUrlController);

// SSE Endpoint
// SSE Endpoint
app.get('/events', async (req, res) => {
  const layoutId = req.query.layoutId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
    layoutId,
  };
  state.clients.push(newClient);

  console.log(`[BACKEND] SSE client connected: ${clientId} for layoutId: ${layoutId}`);

  // Initialize cache if not already done
  if (!state.layoutUpdatesCache[layoutId]) {
    try {
      const initialData = await fetchLayoutById(layoutId); // Use fetchLayoutById instead of getLayoutById
      if (initialData) {
        state.layoutUpdatesCache[layoutId] = initialData;
        console.log(`[BACKEND] Cached initial layout for layoutId: ${layoutId}`);
      } else {
        console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
      }
    } catch (error) {
      console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
    }
  }

  // Send initial layout data from cache
  const cachedLayout = state.layoutUpdatesCache[layoutId];
  if (cachedLayout) {
    res.write(`data: ${JSON.stringify({ type: "layoutData", data: cachedLayout })}\n\n`);
    console.log(`[BACKEND] Sent initial layout data to client ${clientId} for layoutId: ${layoutId}`);
  } else {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Layout not found" })}\n\n`);
  }

  // Remove client when connection closes
  req.on('close', () => {
    console.log(`[BACKEND] SSE client disconnected: ${clientId}`);
    const index = state.clients.findIndex((client) => client.id === clientId);
    if (index !== -1) {
      state.clients.splice(index, 1);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// Start listening to DynamoDB Streams
listenToDynamoDbStreams();
