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

    // Show only the prediction points (optional: hide video and face overlay)
    webgazer.showVideo(false);
    webgazer.showFaceOverlay(false);
    webgazer.showPredictionPoints(true);

    // Handle visibility change to pause/resume WebGazer
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && isInitializedRef.current) {
        webgazer.pause();  // Pause when tab is hidden
      } else if (document.visibilityState === "visible" && isActive) {
        webgazer.resume(); // Resume when visible again
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

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
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive, onGazeAtAd]);

  return null; // Remove any UI related to the webcam since it's not needed
};

export default GazeTrackingComponent;
