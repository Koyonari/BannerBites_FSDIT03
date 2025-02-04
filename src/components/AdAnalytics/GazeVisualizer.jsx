// src/components/AdAnalytics/GazeVisualizer.jsx

import React from "react";
import AnimatedGazeDot from "../AdAnalytics/AnimatedGazeDot"; // Adjust path if needed

const GazeVisualizer = ({
  gazeData,
  boundingBoxes = [],
  showBorders = true,
}) => {
  return (
    <>
      {/* Ensure the gaze dot is correctly positioned */}
      {gazeData && (
        <AnimatedGazeDot
          x={gazeData.x}
          y={gazeData.y}
          size={40} // Example: Increased to 40px
          color="cyan" // Example: Changed to cyan
        />
      )}

      {/* Ensure bounding boxes are visible */}
      {showBorders &&
        boundingBoxes.length > 0 && // Prevent unnecessary rendering
        boundingBoxes.map((box, index) => (
          <div
            key={index}
            className="pointer-events-none absolute border-2 border-red-500"
            style={{
              top: box.top + "px",
              left: box.left + "px",
              width: box.width + "px",
              height: box.height + "px",
              position: "absolute",
              zIndex: 30,
            }}
          />
        ))}
    </>
  );
};

export default GazeVisualizer;
