// src/components/AdAnalytics/GazeTrackingComponent.jsx

import React, { useEffect, useRef } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  const singletonRef = useRef(null);

  useEffect(() => {
    let localInstance = null;

    if (isActive) {
      // If active, set up a local gaze listener
      WebGazerSingleton.initialize((data, elapsedTime) => {
        if (data) onGazeAtAd(data);
      })
        .then((wg) => {
          localInstance = wg;
        })
        .catch((err) => console.error("Error init WebGazer in GazeTracking:", err));
    }

    // Cleanup when isActive changes or component unmounts
    return () => {
      if (localInstance) {
        localInstance.clearGazeListener();
      }
    };
  }, [isActive, onGazeAtAd]);

  // This component doesn’t render anything visually
  return null;
};

export default GazeTrackingComponent;
