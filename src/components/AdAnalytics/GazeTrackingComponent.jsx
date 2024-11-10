import { useEffect } from "react";
import webgazer from "webgazer";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  useEffect(() => {
    if (isActive) {
      webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
          onGazeAtAd(data);
        }
      });
    }

    return () => {
      webgazer.clearGazeListener();
    };
  }, [isActive, onGazeAtAd]);

  return null;
};

export default GazeTrackingComponent;
