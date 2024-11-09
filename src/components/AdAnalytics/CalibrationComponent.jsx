// CalibrationComponent.jsx
import React, { useEffect, useState } from "react";

const calibrationPoints = [
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 50, y: 50 },
  { x: 10, y: 90 },
  { x: 90, y: 90 },
]; // Points are expressed in percentages of the screen width and height

const CalibrationComponent = ({ onCalibrationComplete }) => {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  useEffect(() => {
    if (currentPointIndex < calibrationPoints.length) {
      const timer = setTimeout(() => {
        setCurrentPointIndex(currentPointIndex + 1);
      }, 2000); // Wait for 2 seconds on each point

      return () => clearTimeout(timer);
    } else {
      onCalibrationComplete();
    }
  }, [currentPointIndex, onCalibrationComplete]);

  return (
    <div>
      {calibrationPoints.map((point, index) => (
        <div
          key={index}
          style={{
            position: "fixed",
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: index === currentPointIndex ? "red" : "transparent",
            transition: "background-color 0.3s",
          }}
        />
      ))}
    </div>
  );
};

export default CalibrationComponent;
