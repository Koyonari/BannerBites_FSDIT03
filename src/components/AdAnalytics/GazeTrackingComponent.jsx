// src/components/AdAnalytics/GazeTrackingComponent.jsx

import React, { useEffect, useRef } from "react";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Ensure webgazer is loaded
    if (!window.webgazer) {
      console.error("[WebGazer] webgazer is not loaded.");
      alert("Gaze tracking failed to initialize. Please ensure WebGazer.js is correctly loaded.");
      return;
    }

    // Ensure the advertisement element exists
    const adElement = document.getElementById("advertisement");
    if (!adElement) {
      console.error("[WebGazer] Advertisement element with id 'advertisement' not found.");
      alert("Gaze tracking failed to initialize. Advertisement element not found.");
      return;
    }

    // Initialize WebGazer
    window.webgazer
      .setRegression("ridge") // Set regression method
      .setTracker("TFFacemesh") // Updated to "TFFacemesh"
      .setGazeListener((data, elapsedTime) => {
        if (data) {
          const { x, y } = data; // Gaze coordinates
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
    window.webgazer.showVideo(true); // Changed to true to display video
    window.webgazer.showFaceOverlay(true); // Changed to true to display face overlay
    window.webgazer.showPredictionPoints(true); // Changed to true to display prediction points

    // Cleanup function
    return () => {
      if (isInitializedRef.current && window.webgazer) {
        try {
          window.webgazer.end();
          console.log("[WebGazer] Ended successfully.");
          isInitializedRef.current = false;
        } catch (error) {
          console.error("[WebGazer] Error during cleanup:", error);
        }
      }
    };
  }, [isActive, onGazeAtAd]);

  return null; // This component doesn't render anything visible
};

export default GazeTrackingComponent;
