// src/components/AdAnalytics/GazeTrackingComponent.jsx

import React, { useEffect, useRef } from "react";
import webgazer from "webgazer";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  const isInitializedRef = useRef(false);
  const lastGazeTimeRef = useRef(0);
  const throttleInterval = 100; // Process gaze data every 100ms

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Ensure WebGazer is loaded
    if (!webgazer) {
      console.error("[WebGazer] webgazer is not loaded.");
      alert("Gaze tracking failed to initialize. Please ensure WebGazer.js is correctly loaded.");
      return;
    }

    // Initialize WebGazer
    webgazer
      .setRegression("ridge")
      .setTracker("TFFacemesh")
      .setGazeListener((data, elapsedTime) => {
        const now = Date.now();
        if (data && (now - lastGazeTimeRef.current) > throttleInterval) {
          lastGazeTimeRef.current = now;
          const { x, y } = data;
          onGazeAtAd({ x, y, elapsedTime });
        }
      })
      .begin()
      .then(() => {
        console.log("[WebGazer] Initialized successfully.");
        isInitializedRef.current = true;
      })
      .catch((err) => {
        console.error("[WebGazer] Initialization error:", err);
        alert("Gaze tracking failed to initialize.");
      });

    // Show the webgazer video and overlays
    webgazer.showVideo(true);
    webgazer.showFaceOverlay(true);
    webgazer.showPredictionPoints(true);

    // Cleanup function
    return () => {
      if (isInitializedRef.current) {
        try {
          webgazer.end();
          console.log("[WebGazer] Ended successfully.");
          isInitializedRef.current = false;
        } catch (error) {
          console.error("[WebGazer] Error during cleanup:", error);
        }
      }
    };
  }, [isActive, onGazeAtAd]);

  return (
    <div className="webgazer-video-container" style={{ position: 'fixed', top: 10, left: 10, zIndex: 10000 }}>
      <video id="webgazerVideoFeed" width="320" height="240" style={{ border: '2px solid #fff' }}></video>
      <canvas id="webgazerFaceOverlay" width="320" height="240" style={{ position: 'absolute', top: 10, left: 10 }}></canvas>
      <canvas id="webgazerPredictionPoints" width="320" height="240" style={{ position: 'absolute', top: 10, left: 10 }}></canvas>
    </div>
  );
};

export default GazeTrackingComponent;
