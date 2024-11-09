// GazeTrackingComponent.jsx
import { useEffect, useState } from "react";
import CalibrationComponent from "./CalibrationComponent";

const GazeTrackingComponent = ({ onGazeData, isActive }) => {
  const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Function to dynamically load the WebGazer script
    const loadWebGazerScript = () => {
      return new Promise((resolve, reject) => {
        if (window.webgazer) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://webgazer.cs.brown.edu/webgazer.js";
        script.async = true;

        script.onload = () => {
          resolve();
        };

        script.onerror = () => {
          reject(new Error("Failed to load WebGazer script."));
        };

        document.body.appendChild(script);
      });
    };

    const initializeWebGazer = async () => {
      try {
        await loadWebGazerScript();
        if (isMounted && isActive && window.webgazer) {
          window.webgazer
            .setRegression("ridge")
            .setGazeListener((data, elapsedTime) => {
              if (data != null && isCalibrated) {
                onGazeData(data);
              }
            })
            .begin();

          window.webgazer
            .showVideoPreview(false)
            .showFaceOverlay(false)
            .showFaceFeedbackBox(false);

          setIsWebGazerLoaded(true);
        }
      } catch (error) {
        console.error("Error initializing WebGazer:", error);
      }
    };

    if (isActive) {
      initializeWebGazer();
    }

    return () => {
      isMounted = false;
      if (window.webgazer) {
        try {
          window.webgazer.pause();
          window.webgazer.clearData(); // Optional: Clears the stored gaze data to avoid memory leak
          window.webgazer.end();
          setIsWebGazerLoaded(false);
          setIsCalibrated(false);
        } catch (error) {
          console.warn("Error ending WebGazer instance: ", error);
        }
      }
    };
  }, [isActive, onGazeData, isCalibrated]);

  const handleCalibrationComplete = () => {
    setIsCalibrated(true);
    console.log("Calibration complete!");
  };

  return (
    <>
      {!isCalibrated && isActive && (
        <CalibrationComponent onCalibrationComplete={handleCalibrationComplete} />
      )}
      {isCalibrated && isWebGazerLoaded && (
        // Optionally, display a message or visual indicator that calibration is done
        <div style={{ position: "fixed", bottom: 10, left: 10, color: "green" }}>
          Calibration Complete! Tracking is active.
        </div>
      )}
    </>
  );
};

export default GazeTrackingComponent;
