// services/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'], // Ensure compatibility with different transports
});

export default socket;
