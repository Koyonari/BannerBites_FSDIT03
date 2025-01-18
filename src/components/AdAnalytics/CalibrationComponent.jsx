// src/components/AdAnalytics/CalibrationComponent.jsx

import React, { useState, useEffect } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

const CalibrationComponent = ({ onCalibrationComplete }) => {
  // Calibration points
  const points = [
    { xPercent: 10, yPercent: 10 },
    { xPercent: 90, yPercent: 10 },
    { xPercent: 10, yPercent: 90 },
    { xPercent: 90, yPercent: 90 },
    { xPercent: 50, yPercent: 50 },
  ];

  const [calibrationPoints] = useState(points);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  // Number of clicks required per point
  const requiredClicks = 3;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        console.log("[Calibration] Initializing WebGazer...");
        const wg = await WebGazerSingleton.initialize();
        console.log("[Calibration] WebGazer initialized:", wg);

        wg.setStorePoints(true);
        console.log("[Calibration] WebGazer is set to store points.");

        // Additional check to confirm WebGazer is ready
        if (isMounted) {
          console.log("[Calibration] WebGazer is ready for calibration.");
        }
      } catch (err) {
        console.error("[Calibration] WebGazer initialization error:", err);
      }
    })();

    return () => {
      console.log("[Calibration] Cleaning up CalibrationComponent.");
      isMounted = false;
      // Note: We do NOT call WebGazerSingleton.end() here to keep the session alive
    };
  }, []);

  const handleDotClick = async () => {
    // Calculate actual screen coordinates based on percentages
    const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
    const x = (xPercent / 100) * window.innerWidth;
    const y = (yPercent / 100) * window.innerHeight;

    try {
      const wg = await WebGazerSingleton.initialize();
      console.log("[Calibration] Recording screen position at:", { x, y });

      wg.recordScreenPosition(x, y);

      // Optional: Log the number of stored points
      const storedPoints = wg.getStoredPoints ? wg.getStoredPoints() : [];
      console.log("[Calibration] Number of stored points:", storedPoints.length);
    } catch (error) {
      console.error("[Calibration] Error recording screen position:", error);
    }

    // Increment click count and handle progression
    setClickCount((prev) => {
      const newClickCount = prev + 1;
      console.log(`[Calibration] Click ${newClickCount}/${requiredClicks} at Point ${currentPointIndex + 1}`);

      if (newClickCount >= requiredClicks) {
        const nextIndex = currentPointIndex + 1;
        if (nextIndex < calibrationPoints.length) {
          setCurrentPointIndex(nextIndex);
          console.log(`[Calibration] Moving to Point ${nextIndex + 1}`);
          return 0; // Reset click count for the next point
        } else {
          console.log("[Calibration] All calibration points completed.");
          if (onCalibrationComplete) onCalibrationComplete();
        }
      }
      return newClickCount;
    });
  };

  // Always display the calibration overlay without waiting for camera readiness
  const { xPercent, yPercent } = calibrationPoints[currentPointIndex];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-[9999]">
      <p className="text-white mb-4 text-lg">
        Click each dot {requiredClicks} times to calibrate.
      </p>

      <div
        style={{
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: "translate(-50%, -50%)",
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "red",
          border: "2px solid white",
          cursor: "pointer",
        }}
        onClick={handleDotClick}
      />

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
