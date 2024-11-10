// src/components/AdAnalytics/GazeVisualizer.jsx

import React, { useEffect, useRef } from "react";

const GazeVisualizer = ({ gazeData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Initialize canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId;

    const draw = () => {
      if (!gazeData) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Adjust gaze coordinates
      const adjustedX = gazeData.x - window.scrollX;
      const adjustedY = gazeData.y - window.scrollY;

      // Draw gaze point
      ctx.beginPath();
      ctx.arc(adjustedX, adjustedY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fill();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw debugging rectangles
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

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
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
