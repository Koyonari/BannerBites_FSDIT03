import React, { useState, useEffect } from "react";
import WebGazerSingleton from "../../utils/WebGazerSingleton";
import { motion } from "framer-motion";

const CalibrationComponent = ({ onCalibrationComplete, requiredClicks = 5 }) => {
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

  // Animation Variants
  const dotVariants = {
    idle: { scale: 1 },
    feedback: { scale: 1.3, backgroundColor: "lime" },
  };

  const textVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 z-[9999]"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
      transition={{ duration: 0.5 }}
    >
      <motion.p
        className="text-white mb-4 text-lg"
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Click each dot {requiredClicks} times to calibrate.
      </motion.p>

      <motion.div
        onClick={handleDotClick}
        className="absolute cursor-pointer rounded-full border-2 border-white"
        variants={dotVariants}
        initial="idle"
        animate={dotFeedback ? "feedback" : "idle"}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        style={{
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: "translate(-50%, -50%)",
          width: 40,
          height: 40,
          backgroundColor: "red",
        }}
      />

      <motion.div
        className="mt-4 text-white"
        variants={textVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p>
          Point {currentPointIndex + 1} of {calibrationPoints.length}
        </p>
        <p>
          Clicks: {clickCount} / {requiredClicks}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CalibrationComponent;
