// src/components/AdAnalytics/CalibrationComponent.jsx
import React, { useState, useEffect } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

const CalibrationComponent = ({ onCalibrationComplete, requiredClicks = 5 }) => {
  // Expanded set of calibration points as recommended in the GitHub wiki and usage guides.
  const points = [
    { xPercent: 10, yPercent: 10 },
    { xPercent: 50, yPercent: 10 },
    { xPercent: 90, yPercent: 10 },
    { xPercent: 10, yPercent: 50 },
    { xPercent: 50, yPercent: 50 },
    { xPercent: 90, yPercent: 50 },
    { xPercent: 10, yPercent: 90 },
    { xPercent: 50, yPercent: 90 },
    { xPercent: 90, yPercent: 90 },
  ];
  
  const [calibrationPoints] = useState(points);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [dotFeedback, setDotFeedback] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const wg = await WebGazerSingleton.initialize();
        wg.setStorePoints(true);
      } catch (err) {
        console.error("Calibration initialization error:", err);
      } 
    })();
  }, []);

  const handleDotClick = async () => {
    // Provide immediate visual feedback
    setDotFeedback(true);
    setTimeout(() => setDotFeedback(false), 80);

    const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
    const x = (xPercent / 100) * window.innerWidth;
    const y = (yPercent / 100) * window.innerHeight;

    try {
      const wg = await WebGazerSingleton.initialize();
      wg.recordScreenPosition(x, y);
    } catch (error) {
      console.error("Error recording position:", error);
    }

    setClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= requiredClicks) {
        const nextIndex = currentPointIndex + 1;
        if (nextIndex < calibrationPoints.length) {
          setCurrentPointIndex(nextIndex);
          return 0;
        } else {
          onCalibrationComplete && onCalibrationComplete();
          console.log("[CalibrationComponent] Calibration done for all points");
        }
      }
      return newCount;
    });
  };

  const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-[9999]">
      <p className="text-white mb-4 text-lg">Click each dot {requiredClicks} times to calibrate.</p>
      <div
        onClick={handleDotClick}
        style={{
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: "translate(-50%, -50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: dotFeedback ? "lime" : "red",
          border: "2px solid white",
          cursor: "pointer",
        }}
      />
      <p className="mt-4 text-white">
        Point {currentPointIndex + 1} of {calibrationPoints.length}
      </p>
      <p className="text-white">Clicks: {clickCount} / {requiredClicks}</p>
    </div>
  );
};

export default CalibrationComponent;