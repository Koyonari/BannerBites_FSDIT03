// src/components/GazeVisualizer.jsx

import React from "react";
import { motion } from "framer-motion";

const GazeVisualizer = ({ gazeData, boundingBoxes, showBorders }) => {
  return (
    <>
      {/* Gaze Dot */}
      {gazeData && (
        <motion.div
          className="absolute z-50 h-6 w-6 rounded-full bg-red-500 pointer-events-none"
          initial={{ x: gazeData.x, y: gazeData.y }}
          animate={{ x: gazeData.x, y: gazeData.y }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ top: gazeData.y, left: gazeData.x, position: "absolute" }}
          aria-label="Gaze Dot"
        />
      )}

      {/* Bounding Boxes */}
      {showBorders &&
        boundingBoxes.map((box, index) => (
          <div
            key={index}
            className="absolute border-2 border-red-500 pointer-events-none"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              height: box.height,
              position: "absolute",
              zIndex: 9999  // or a high enough value
            }}
            aria-label={`Bounding Box ${index + 1}`}
          />
        ))}
    </>
  );
};

export default GazeVisualizer;
