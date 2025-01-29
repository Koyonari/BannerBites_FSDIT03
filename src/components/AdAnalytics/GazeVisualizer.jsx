// src/components/GazeVisualizer.jsx
import React from "react";
import AnimatedGazeDot from "../AdAnalytics/AnimatedGazeDot"; // adjust path if needed

const GazeVisualizer = ({ gazeData, boundingBoxes, showBorders }) => {
  return (
    <>
      {/* Gaze Dot via AnimatedGazeDot */}
      {gazeData && (
        <AnimatedGazeDot x={gazeData.x} y={gazeData.y} />
      )}

      {/* Bounding Boxes (unchanged) */}
      {showBorders &&
        boundingBoxes.map((box, index) => (
          <div
            key={index}
            className="pointer-events-none absolute border-2 border-red-500"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
              zIndex: 9999,
            }}
          />
        ))}
    </>
  );
};

export default GazeVisualizer;
