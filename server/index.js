const cors = require("cors");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController, getLayoutById } = require("./controllers/layoutController");
const { clients, layoutUpdatesCache } = require("./state"); // Import shared state

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
app.get('/events', (req, res) => {
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
  clients.push(newClient);

  console.log(`[BACKEND] SSE client connected: ${clientId} for layoutId: ${layoutId}`);

  // Send initial layout data if available
  if (layoutUpdatesCache[layoutId]) {
    const initialData = layoutUpdatesCache[layoutId];
    res.write(`data: ${JSON.stringify({ type: "layoutData", data: initialData })}\n\n`);
    console.log(`[BACKEND] Sent initial layout data to client ${clientId} for layoutId: ${layoutId}`);
  } else {
    // Fetch layout from database and send it
    getLayoutById(layoutId)
      .then((initialData) => {
        if (initialData) {
          res.write(`data: ${JSON.stringify({ type: "layoutData", data: initialData })}\n\n`);
          console.log(`[BACKEND] Sent initial layout data to client ${clientId} for layoutId: ${layoutId}`);
          layoutUpdatesCache[layoutId] = initialData; // Update cache
        } else {
          console.warn(`[BACKEND] No layout data found for layoutId: ${layoutId}`);
        }
      })
      .catch((error) => {
        console.error(`[BACKEND] Error fetching layout data for layoutId: ${layoutId}`, error);
      });
  }

  // Remove client when connection closes
  req.on('close', () => {
    console.log(`[BACKEND] SSE client disconnected: ${clientId}`);
    // Modify the clients array in place
    const index = clients.findIndex((client) => client.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});

// Start listening to DynamoDB Streams
listenToDynamoDbStreams();
