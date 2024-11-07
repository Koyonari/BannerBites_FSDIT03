import React, { useEffect, useState } from "react";
import AdViewer from "./AdViewer";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    let socket;

     // Function to connect WebSocket and manage reconnects
     const connectWebSocket = () => {
      socket = new WebSocket("ws://localhost:5000"); // Update the WebSocket URL to match your backend

      socket.onopen = () => {
        console.log("WebSocket connection opened");
        if (layoutId) {
          // Request the layout by ID once connected
          socket.send(JSON.stringify({ type: "getLayout", layoutId }));
        }
      };

      socket.onmessage = (event) => {
        // Handle incoming layout data
        try {
          const message = JSON.parse(event.data);
          if (message.type === "layoutData") {
            setLayout(message.data);
          } else if (message.type === "error") {
            console.error("Error from server:", message.message);
          }
        } catch (error) {
          console.error("Error parsing message from WebSocket:", error);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed. Attempting to reconnect...");
        // Reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    // Clean up WebSocket connection on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [layoutId]);

  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div>
      <h2>Layout Viewer</h2>
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
