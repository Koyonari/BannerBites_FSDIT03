// src/components/AdAnalytics/AnimatedGazeDot.jsx

import React from "react";
import PropTypes from "prop-types";

const AnimatedGazeDot = ({ x, y, size = 30, color = "red", animationDuration = "0.3s" }) => {
  const dotStyle = {
    position: "absolute",
    top: `${y}px`,
    left: `${x}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity: 0.9,
    transition: `all ${animationDuration} ease-out`,
    zIndex: 10000, // Ensure the dot is on top
  };

  return <div style={dotStyle}></div>;
};

AnimatedGazeDot.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  size: PropTypes.number, // Diameter in pixels
  color: PropTypes.string, // CSS color value
  animationDuration: PropTypes.string, // e.g., "0.3s"
};

export default AnimatedGazeDot;
