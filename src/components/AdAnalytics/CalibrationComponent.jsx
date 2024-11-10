import React, { useEffect, useState } from "react";
import webgazer from "webgazer";

// Example using calibration points for the calibration process
const calibrationPoints = [
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 50, y: 50 },
  { x: 10, y: 90 },
  { x: 90, y: 90 },
];

const CalibrationComponent = ({ onCalibrationComplete }) => {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (currentPointIndex < calibrationPoints.length) {
      setIsCapturing(true);
      const timer = setTimeout(() => {
        setIsCapturing(false);
        setCurrentPointIndex(currentPointIndex + 1);
      }, 2000); // Wait for 2 seconds on each point

      webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
          console.log(`Calibration Data Captured at Point ${currentPointIndex}`, data);
        }
      });

      return () => {
        clearTimeout(timer);
        webgazer.clearGazeListener();
      };
    } else {
      setIsCapturing(false);
      onCalibrationComplete();
    }
  }, [currentPointIndex, onCalibrationComplete]);

  return (
    <div className="calibration-overlay fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
      <p className="mb-4 text-white text-lg">
        Please follow the red dot with your eyes for calibration.
      </p>

      {/* Render calibration points */}
      {calibrationPoints.map((point, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: "translate(-50%, -50%)", // Center the point
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: index === currentPointIndex ? "red" : "transparent",
            border: "2px solid red",
            transition: "background-color 0.3s",
            pointerEvents: "none", // Ensure calibration points don't block interactions
          }}
        />
      ))}

      {/* Capturing Indicator */}
      {isCapturing && (
        <div className="capturing-indicator absolute bottom-10">
          <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-white mt-2">Capturing gaze data...</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-4 w-1/2 bg-gray-300 rounded-full">
        <div
          className="bg-green-500 text-xs leading-none py-1 text-center text-white rounded-full"
          style={{ width: `${((currentPointIndex) / calibrationPoints.length) * 100}%` }}
        >
          {Math.round(((currentPointIndex) / calibrationPoints.length) * 100)}%
        </div>
      </div>

      {/* Current Calibration Point */}
      <p className="mt-2 text-white">
        Calibration Point {currentPointIndex + 1} of {calibrationPoints.length}
      </p>
    </div>
  );
};

export default CalibrationComponent;
