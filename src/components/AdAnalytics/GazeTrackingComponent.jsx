import { useEffect } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  useEffect(() => {
    if (isActive) {
      WebGazerSingleton.initialize(onGazeAtAd);
    }

    return () => {
      if (!isActive) {
        WebGazerSingleton.end();
      }
    };
  }, [isActive, onGazeAtAd]);

  return null; // This component has no visible output
};

export default GazeTrackingComponent;
