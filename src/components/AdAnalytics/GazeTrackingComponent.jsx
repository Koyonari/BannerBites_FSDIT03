import { useEffect, useRef } from "react";
import webgazer from "webgazer";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  const webgazerInitializedRef = useRef(false);

  useEffect(() => {
    if (isActive) {
      webgazer
        .setGazeListener((data, elapsedTime) => {
          if (data) {
            onGazeAtAd(data);
          }
        })
        .begin()
        .then(() => {
          webgazerInitializedRef.current = true;
        })
        .catch((error) => {
          console.error("Error initializing WebGazer:", error);
        });
    }

    return () => {
      if (webgazerInitializedRef.current) {
        webgazer.end();
        webgazer.clearGazeListener();
        webgazerInitializedRef.current = false;
      }
    };
  }, [isActive, onGazeAtAd]);

  return null; // This component has no visible output
};

export default GazeTrackingComponent;
