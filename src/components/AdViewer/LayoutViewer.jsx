// components/LayoutViewer.jsx

import React, { useState, useEffect } from "react";
import AdViewer from "./AdViewer";
import { io } from "socket.io-client";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    console.log('Setting up WebSocket...');
    const socket = io('http://localhost:5000'); // assuming you're using socket.io
  
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
  
      // Request the initial layout data
      socket.emit('getLayout', { layoutId });
    });
  
    socket.on('layoutData', (data) => {
      console.log('Received initial layout data:', data);
      setLayout(data);
    });
  
    socket.on('layoutUpdate', (data) => {
      console.log('Received layout update:', data);
      setLayout(data);
    });
  
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  
    return () => {
      socket.disconnect();
      console.log('WebSocket disconnected');
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
