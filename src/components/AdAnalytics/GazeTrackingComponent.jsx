// src/components/AdAnalytics/GazeTrackingComponent.jsx
import React, { useEffect, useState, useRef } from "react";
import CalibrationComponent from "./CalibrationComponent";

const GazeTrackingComponent = ({ onGazeData, isActive }) => {
  const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const webgazerInitializedRef = useRef(false); // Ref to track initialization

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
        if (isMounted && isActive && isCalibrated && window.webgazer) {
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
          webgazerInitializedRef.current = true; // Mark as initialized
        }
      } catch (error) {
        console.error("Error initializing WebGazer:", error);
      }
    };

    if (isActive && isCalibrated) {
      initializeWebGazer();
    }

    return () => {
      isMounted = false;
      if (webgazerInitializedRef.current && window.webgazer) {
        try {
          window.webgazer.pause();
          window.webgazer.clearData(); // Optional: Clears the stored gaze data to avoid memory leak
          window.webgazer.end();
          window.webgazer = null; // Clear the reference
          setIsWebGazerLoaded(false);
          setIsCalibrated(false);
          webgazerInitializedRef.current = false; // Reset the ref
        } catch (error) {
          console.warn("Error ending WebGazer instance: ", error);
        }
      }
    };
  }, [isActive, onGazeData, isCalibrated]);

  // Function to handle calibration completion
  const handleCalibrationComplete = () => {
    setIsCalibrated(true);
    setIsCalibrating(false);
    console.log("Calibration complete!");
  };

  // Function to start calibration
  const startCalibration = () => {
    setIsCalibrating(true);
  };

  return (
    <>
      {!isCalibrated && isActive && !isCalibrating && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p className="mb-4 text-center">
            Click the button below to start calibration for gaze tracking.
          </p>
          <button
            onClick={startCalibration}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Start Calibration
          </button>
        </div>
      )}
      {!isCalibrated && isActive && isCalibrating && (
        <CalibrationComponent onCalibrationComplete={handleCalibrationComplete} />
      )}
      {isCalibrated && isWebGazerLoaded && (
        // Optionally, display a message or visual indicator that calibration is done
        <div
          style={{
            position: "fixed",
            bottom: 10,
            left: 10,
            color: "green",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "5px 10px",
            borderRadius: "4px",
          }}
        >
          Calibration Complete! Tracking is active.
        </div>
      )}
    </>
  );
};

export default GazeTrackingComponent;
