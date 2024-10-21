// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Enable CORS to allow requests from your frontend
app.use(cors());

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your React app's URL
    methods: ['GET', 'POST'],
  },
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Emit initial ads when the client connects
  socket.emit('updateAds', [
    { type: 'text', content: 'Welcome to our Ad Service!' },
    { type: 'image', content: 'https://via.placeholder.com/150' },
  ]);

  // Listen for any custom events from the client (if needed)
  socket.on('someEvent', (data) => {
    console.log('Received some event:', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
