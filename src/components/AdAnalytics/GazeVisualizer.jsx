// src/components/AdAnalytics/GazeVisualizer.jsx

import React, { useEffect, useRef } from "react";

const GazeVisualizer = ({ gazeData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !gazeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Resize canvas to match the window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a circle at the gaze coordinates
    ctx.beginPath();
    ctx.arc(gazeData.x, gazeData.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw camera bounding rectangle for debugging
    const cameraElement = document.getElementById("webgazerVideoFeed");
    if (cameraElement) {
      const rect = cameraElement.getBoundingClientRect();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      ctx.fillStyle = "blue";
      ctx.font = "16px Arial";
      ctx.fillText("Camera", rect.left, rect.top - 10);
    }

    // Draw ad bounding rectangles for debugging
    const adElements = document.querySelectorAll(".ad-item");
    adElements.forEach((adElement) => {
      const rect = adElement.getBoundingClientRect();
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      ctx.fillStyle = "green";
      ctx.font = "14px Arial";
      const adId = adElement.getAttribute("data-ad-id");
      ctx.fillText(`Ad ${adId}`, rect.left, rect.top - 10);
    });

  }, [gazeData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};

export default GazeVisualizer;