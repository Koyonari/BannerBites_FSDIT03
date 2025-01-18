import React, { useState, useEffect } from 'react';

const generateRandomPoints = (numPoints) => {
  return Array.from({ length: numPoints }, () => ({
    xPercent: Math.random() * 80 + 10,
    yPercent: Math.random() * 80 + 10,
  }));
};

const CalibrationComponent = ({ onCalibrationComplete }) => {
  const [calibrationPoints] = useState(generateRandomPoints(9));
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const requiredClicks = 5;

  useEffect(() => {
    let webgazerInstance = null;

    import('webgazer')
      .then((module) => {
        webgazerInstance = module.default;
        webgazerInstance
          .setRegression('ridge')
          .saveDataAcrossSessions(true)
          .begin();
      })
      .catch((error) => {
        console.error('Error initializing WebGazer:', error);
      });

    return () => {
      if (webgazerInstance) {
        webgazerInstance.end();
        webgazerInstance.clearData();
      }
    };
  }, []);

  const handleDotClick = () => {
    const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
    const x = (xPercent / 100) * window.innerWidth;
    const y = (yPercent / 100) * window.innerHeight;

    // Record gaze data for the current point
    import('webgazer').then((module) => {
      module.default.recordScreenPosition(x, y);
    });

    setClickCount((prev) => {
      if (prev + 1 >= requiredClicks) {
        // Move to the next point
        if (currentPointIndex + 1 < calibrationPoints.length) {
          setCurrentPointIndex((prevIndex) => prevIndex + 1);
          return 0; // Reset click count
        } else {
          // Calibration complete
          onCalibrationComplete();
        }
      }
      return prev + 1;
    });
  };

  return (
    <div className="calibration-overlay fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
      <p className="mb-4 text-white text-lg">
        Click the dot {requiredClicks} times to calibrate.
      </p>
      {currentPointIndex < calibrationPoints.length && (
        <div
          style={{
            position: 'absolute',
            left: `${calibrationPoints[currentPointIndex].xPercent}%`,
            top: `${calibrationPoints[currentPointIndex].yPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'red',
            border: '2px solid white',
            cursor: 'pointer',
          }}
          onClick={handleDotClick}
        />
      )}
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
