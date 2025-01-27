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
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Ensure WebGazer is initialized and ready to record
    (async () => {
      try {
        await WebGazerSingleton.initialize();
        WebGazerSingleton.instance.setStorePoints(true);
        console.log("WebGazer initialized for calibration.");
      } catch (err) {
        console.error("Calibration initialization error:", err);
      }
    })();
  }, []);

  const handleDotClick = async () => {
    setDotFeedback(true);
    setTimeout(() => setDotFeedback(false), 200);

    const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
    const x = (xPercent / 100) * window.innerWidth;
    const y = (yPercent / 100) * window.innerHeight;

    try {
      // Record the screen position for calibration
      WebGazerSingleton.instance.recordScreenPosition(x, y);
      console.log(`Recorded calibration point ${currentPointIndex + 1}: (${x}, ${y})`);
    } catch (error) {
      console.error("Error recording calibration position:", error);
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
        }
      }
      return newCount;
    });
  };

  const { xPercent, yPercent } = calibrationPoints[currentPointIndex];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="absolute top-5 text-white text-lg">
        Click each dot {requiredClicks} times to calibrate.
      </div>
      <div
        onClick={handleDotClick}
        style={{
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: "translate(-50%, -50%)",
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: dotFeedback ? "limegreen" : "tomato",
          border: "3px solid white",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        aria-label={`Calibration Point ${currentPointIndex + 1}`}
      />
      <div className="absolute bottom-5 text-white">
        <span>
          Point {currentPointIndex + 1} of {calibrationPoints.length}
        </span>
        <br />
        <span>
          Clicks: {clickCount} / {requiredClicks}
        </span>
      </div>
    </div>
  );
};

export default CalibrationComponent;
