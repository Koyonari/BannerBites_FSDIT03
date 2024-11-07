const cors = require("cors");
const { dynamoDbClient, listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController, getLayoutById  } = require("./controllers/layoutController");
const http = require("http");
const WebSocket = require("ws");

// Load environment variables
dotenv.config();

// Set up Express and the WebSocket server
const express = require("express");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
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

// WebSocket server to manage clients
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "getLayout" && parsedMessage.layoutId) {
        // Fetch data from DynamoDB and send to client
        const layoutId = parsedMessage.layoutId;
        // You can implement direct DynamoDB fetch here based on `layoutId`
        console.log(`Fetching data for layoutId: ${layoutId}`);
        const layout = await getLayoutById(layoutId);
        ws.send(JSON.stringify({ type: "layoutData", data: layout }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start listening to DynamoDB Streams
listenToDynamoDbStreams(wss); // Make sure to pass WebSocket Server instance

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});