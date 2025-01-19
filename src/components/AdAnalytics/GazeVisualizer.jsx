// src/components/AdAnalytics/GazeVisualizer.jsx
import React from "react";
import { AnimatePresence } from "framer-motion";
import AnimatedGazeDot from "./AnimatedGazeDot";

const GazeVisualizer = ({ gazeData }) => {
  return (
    <>
      {/* Optionally keep your canvas for other visuals */}
      {/* ...canvas drawing logic if needed... */}

      {/* Render the animated gaze dot only if gaze data is available */}
      <AnimatePresence>
        {gazeData && (
          <AnimatedGazeDot x={gazeData.x - window.scrollX} y={gazeData.y - window.scrollY} />
        )}
      </AnimatePresence>
    </>
  );
};

export default GazeVisualizer;
