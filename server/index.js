// app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const layoutRoutes = require("./routes/layoutRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tvRoutes = require("./routes/tvRoutes");
const { generatePresignedUrlController } = require("./controllers/layoutController");

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
