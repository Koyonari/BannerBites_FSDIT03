// src/components/AdAnalytics/CalibrationComponent.jsx
import React, { useState, useEffect } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

// A fixed set of calibration points, or random if you prefer
const cornerPoints = [
  { xPercent: 10, yPercent: 10 },  // top-left
  { xPercent: 90, yPercent: 10 },  // top-right
  { xPercent: 50, yPercent: 50 },  // center
  { xPercent: 10, yPercent: 90 },  // bottom-left
  { xPercent: 90, yPercent: 90 },  // bottom-right
];

const CalibrationComponent = ({ onCalibrationComplete }) => {
  const [calibrationPoints] = useState(cornerPoints);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  // Number of clicks required per point
  const requiredClicks = 5;

  useEffect(() => {
    // We can optionally ensure the singleton is loaded
    (async () => {
      try {
        await WebGazerSingleton.initialize();
      } catch (err) {
        console.error("Error initializing WebGazer in CalibrationComponent:", err);
      }
    })();

    // No cleanup needed here usually
  }, []);

  const handleDotClick = async () => {
    const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
    const x = (xPercent / 100) * window.innerWidth;
    const y = (yPercent / 100) * window.innerHeight;

    try {
      // Get the already loaded instance
      const wg = await WebGazerSingleton.initialize();
      wg.recordScreenPosition(x, y);
    } catch (err) {
      console.error("Error recording screen position:", err);
    }

    setClickCount((prev) => {
      // If we’ve hit requiredClicks, move on to next point
      if (prev + 1 >= requiredClicks) {
        // Are there more points left?
        if (currentPointIndex + 1 < calibrationPoints.length) {
          setCurrentPointIndex((prevIndex) => prevIndex + 1);
          return 0; // reset click count
        } else {
          // If no more points, calibration is complete
          onCalibrationComplete();
        }
      }
      return prev + 1;
    });
  };

  return (
    <div className="calibration-overlay fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[9999]">
      <p className="mb-4 text-white text-lg">
        Click the dot {requiredClicks} times to calibrate.
      </p>

      {currentPointIndex < calibrationPoints.length && (
        <div
          style={{
            position: "absolute",
            left: `${calibrationPoints[currentPointIndex].xPercent}%`,
            top: `${calibrationPoints[currentPointIndex].yPercent}%`,
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: clickCount >= requiredClicks - 1 ? "green" : "red",
            border: "2px solid white",
            cursor: "pointer",
          }}
          onClick={handleDotClick}
        />
      )}

      <p className="mt-4 text-white">
        Point {currentPointIndex + 1} of {calibrationPoints.length}
      </p>
      <p className="text-white">
        Clicks: {clickCount} / {requiredClicks}
      </p>
    </div>
  );
};

export default CalibrationComponent;
