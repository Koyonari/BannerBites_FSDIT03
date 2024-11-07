// src/components/LayoutViewer/LayoutViewer.jsx
import React, { useEffect, useState } from "react";
import AdViewer from "./AdViewer";
import useWebSocket from "react-use-websocket";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);
  const socketUrl = "ws://localhost:6000"; // Correct WebSocket port (use wss if secure)

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl, {
    onOpen: () => {
      console.log("[FRONTEND] Connected to WebSocket server");
      sendJsonMessage({ type: "getLayout", layoutId });
      console.log("[FRONTEND] Requesting layout for layoutId:", layoutId);
    },
    onMessage: (event) => {
      if (event.data) {
        console.log("[FRONTEND] Received message from WebSocket server:", event.data);
      }
    },
    onClose: () => {
      console.log("[FRONTEND] Disconnected from WebSocket server");
    },
    onError: (error) => {
      console.error("[FRONTEND] WebSocket error:", error);
    },
    shouldReconnect: () => true, // Reconnect on disconnection
  });

  useEffect(() => {
    if (lastJsonMessage !== null) {
      const response = lastJsonMessage;
      if (response.type === "layoutUpdate" && response.data.layoutId === layoutId) {
        setLayout(response.data);
        console.log("[FRONTEND] Layout updated via WebSocket:", response.data);
      } else if (response.type === "layoutData") {
        setLayout(response.data);
        console.log("[FRONTEND] Received initial layout data via WebSocket:", response.data);
      }
    }
  }, [lastJsonMessage, layoutId]);

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
