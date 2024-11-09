import React, { useEffect, useRef } from "react";

const GazeVisualizer = ({ gazeData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !gazeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let animationFrameId;

    const render = () => {
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

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
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
