// index.js
const cors = require("cors");
const { listenToDynamoDbStreams } = require("./middleware/awsMiddleware");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController, getLayoutById } = require("./controllers/layoutController");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const express = require("express");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Set up Socket.io server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust for production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

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

// WebSocket server to manage clients
// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("getLayout", async ({ layoutId }) => {
    try {
      const layout = await getLayoutById({ params: { layoutId } });

      if (layout) {
        socket.emit("layoutData", layout);
        console.log(`Sent initial layout data for layoutId: ${layoutId}`);
      } else {
        socket.emit("error", { message: "Layout not found." });
        console.log(`Layout not found for layoutId: ${layoutId}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.emit("error", { message: "Invalid message format." });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start listening to DynamoDB Streams and pass the `io` instance
listenToDynamoDbStreams(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});