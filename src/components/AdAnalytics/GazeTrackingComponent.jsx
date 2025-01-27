// src/components/AdAnalytics/GazeTrackingComponent.jsx
import { useEffect, useRef } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";
import KalmanFilter from "../../utils/KalmanFilter";

const GazeTrackingComponent = ({
  isActive,
  onGaze,
  smoothingMethod = "kalman", // Options: "kalman" or "movingAverage"
  smoothingWindow = 10,
  minMove = 0,
}) => {
  const kalmanFilterXRef = useRef(null);
  const kalmanFilterYRef = useRef(null);
  const movingBufferRef = useRef([]);
  const lastOutputRef = useRef({ x: null, y: null });

  useEffect(() => {
    if (smoothingMethod === "kalman") {
      kalmanFilterXRef.current = new KalmanFilter({ R: 0.05, Q: 1 });
      kalmanFilterYRef.current = new KalmanFilter({ R: 0.05, Q: 1 });
    }

    let webgazerInstance = null;
    if (isActive) {
      WebGazerSingleton.initialize((data) => {
        if (!data) return;
        let output;
        if (smoothingMethod === "kalman") {
          const filteredX = kalmanFilterXRef.current.filter(data.x);
          const filteredY = kalmanFilterYRef.current.filter(data.y);
          output = { x: filteredX, y: filteredY };
        } else {
          // Fallback: simple moving average.
          const buffer = movingBufferRef.current;
          buffer.push({ x: data.x, y: data.y });
          if (buffer.length > smoothingWindow) buffer.shift();
          let sumX = 0, sumY = 0;
          buffer.forEach(pt => {
            sumX += pt.x;
            sumY += pt.y;
          });
          output = { x: sumX / buffer.length, y: sumY / buffer.length };
        }
        if (minMove > 0 && lastOutputRef.current.x !== null) {
          const dx = output.x - lastOutputRef.current.x;
          const dy = output.y - lastOutputRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minMove) return;
        }
        lastOutputRef.current = output;
        onGaze(output);
      })
      .then((wg) => {
        webgazerInstance = wg;
        console.log("Gaze tracking started.");
      })
      .catch((err) => {
        console.error("Gaze tracking init error:", err);
      });
    }

    return () => {
      if (webgazerInstance) {
        webgazerInstance.clearGazeListener();
      }
      movingBufferRef.current = [];
      lastOutputRef.current = { x: null, y: null };
      if (kalmanFilterXRef.current) kalmanFilterXRef.current.reset();
      if (kalmanFilterYRef.current) kalmanFilterYRef.current.reset();
    };
  }, [isActive, onGaze, smoothingMethod, smoothingWindow, minMove]);

  return null;
};

export default GazeTrackingComponent;