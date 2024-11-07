// components/LayoutViewer.jsx

import React from "react";
import { useState, useEffect } from "react";
import AdViewer from "./AdViewer";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);
  const socketUrl = 'ws://localhost:5000';

  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket(socketUrl);

    // When the WebSocket connection is established
    socket.onopen = () => {
      console.log('Connected to WebSocket server');

      // Request layout data by sending a message to the server
      socket.send(JSON.stringify({ type: 'getLayout', layoutId }));
    };

    // Handle incoming messages from the server
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);

      if (response.type === 'layoutData') {
        setLayout(response.data);
      } else if (response.type === 'layoutUpdate') {
        // Update layout data if there are any changes
        setLayout(response.data);
      } else if (response.type === 'error') {
        console.error('Error received from WebSocket:', response.message);
      }
    };

    // Handle WebSocket closure
    socket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    // Handle WebSocket errors
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup function to close WebSocket connection when component unmounts
    return () => {
      socket.close();
    };
  }, [layoutId]);

  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div>
      <h2>Layout Viewer</h2>
      <AdViewer layoutId={layoutId} />
    </div>
  );
};

export default LayoutViewer;
