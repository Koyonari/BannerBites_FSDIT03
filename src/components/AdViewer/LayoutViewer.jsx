// components/LayoutViewer.jsx

import React, { useState, useEffect } from "react";
import AdViewer from "./AdViewer";
import { io } from "socket.io-client";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);
  const socketUrl = "http://localhost:5000"; // Socket.IO backend address

  useEffect(() => {
    // Initialize Socket.IO client
    const socket = io(socketUrl);

    // When the Socket.IO connection is established
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");

      // Request layout data by sending a message to the server
      socket.emit("getLayout", { layoutId });
    });

    // Handle incoming messages from the server
    socket.on("layoutData", (data) => {
      setLayout(data);
      console.log("Received initial layout data:", data);
    });

    // Handle layout updates
    socket.on("layoutUpdate", (data) => {
      if (data.layoutId === layoutId) {
        setLayout(data);
        console.log("Received updated layout data:", data);
      }
    });

    // Handle error messages
    socket.on("error", (error) => {
      console.error("Error received from Socket.IO:", error.message);
    });

    // Handle Socket.IO disconnection
    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    // Cleanup function to close Socket.IO connection when component unmounts
    return () => {
      socket.disconnect();
      console.log("Socket.IO connection closed");
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
