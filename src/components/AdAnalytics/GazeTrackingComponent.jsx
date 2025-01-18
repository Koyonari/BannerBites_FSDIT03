// src/components/AdAnalytics/GazeTrackingComponent.jsx
import { useEffect, useRef } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

const GazeTrackingComponent = ({
  isActive,
  onGaze,
  smoothingWindow = 10,
  minMove = 0,
}) => {
  const smoothingBufferRef = useRef([]);
  const lastOutputRef = useRef({ x: null, y: null });

  useEffect(() => {
    let webgazerInstance = null;

    if (isActive) {
      WebGazerSingleton.initialize((data) => {
        if (!data) return;

        const buffer = smoothingBufferRef.current;
        buffer.push({ x: data.x, y: data.y });
        if (buffer.length > smoothingWindow) {
          buffer.shift();
        }

        let sumX = 0,
          sumY = 0;
        buffer.forEach((pt) => {
          sumX += pt.x;
          sumY += pt.y;
        });
        const avgX = sumX / buffer.length;
        const avgY = sumY / buffer.length;

        if (minMove > 0 && lastOutputRef.current.x !== null) {
          const dx = avgX - lastOutputRef.current.x;
          const dy = avgY - lastOutputRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minMove) {
            return;
          }
        }

        lastOutputRef.current = { x: avgX, y: avgY };
        onGaze({ x: avgX, y: avgY });
      })
        .then((wg) => {
          webgazerInstance = wg;
          console.log("[SmoothedGazeTracking] started");
        })
        .catch((err) => {
          console.error("[SmoothedGazeTracking] init error:", err);
        });
    }

    return () => {
      if (webgazerInstance) {
        webgazerInstance.clearGazeListener();
      }
      smoothingBufferRef.current = [];
      lastOutputRef.current = { x: null, y: null };
    };
  }, [isActive, onGaze, smoothingWindow, minMove]);

  return null;
};

export default GazeTrackingComponent;
