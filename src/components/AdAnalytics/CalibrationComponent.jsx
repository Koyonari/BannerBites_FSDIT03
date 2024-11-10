// src/components/AdAnalytics/CalibrationComponent.jsx

import React, { useEffect, useState, useRef } from 'react';
import webgazer from "webgazer";

const generateRandomPoints = (numPoints) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      xPercent: Math.random() * 80 + 10, // Ensures points are within 10%-90% of the screen
      yPercent: Math.random() * 80 + 10,
    });
  }
  return points;
};

const calibrationPoints = generateRandomPoints(9);

const CalibrationComponent = ({ onCalibrationComplete }) => {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [samplesCollected, setSamplesCollected] = useState(0);
  const samplesPerPoint = 20;

  const webgazerInitializedRef = useRef(false);

  useEffect(() => {
    const initializeWebGazer = async () => {
      try {
        await webgazer.setRegression("ridge").saveDataAcrossSessions(true);
        await webgazer.begin();
        webgazerInitializedRef.current = true;
      } catch (error) {
        console.error("Error initializing WebGazer:", error);
      }
    };

    initializeWebGazer();

    return () => {
      if (webgazerInitializedRef.current) {
        webgazer.end();
        webgazer.clearData();
        webgazer.clearGazeListener();
        webgazerInitializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (currentPointIndex < calibrationPoints.length) {
      const interval = setInterval(() => {
        const { xPercent, yPercent } = calibrationPoints[currentPointIndex];
        const x = (xPercent / 100) * window.innerWidth;
        const y = (yPercent / 100) * window.innerHeight;

        webgazer.recordScreenPosition(x, y);
        setSamplesCollected((prev) => prev + 1);

        if (samplesCollected + 1 >= samplesPerPoint) {
          clearInterval(interval);
          setSamplesCollected(0);

          if (currentPointIndex + 1 < calibrationPoints.length) {
            setCurrentPointIndex((prev) => prev + 1);
          } else {
            // Calibration is complete
            webgazer.clearGazeListener();
            webgazer.end();
            onCalibrationComplete();
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentPointIndex, samplesCollected, onCalibrationComplete]);

  return (
    <div className="calibration-overlay fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
      <p className="mb-4 text-white text-lg">
        Focus on the dot until it turns green.
      </p>

      {/* Calibration Point */}
      {currentPointIndex < calibrationPoints.length && (
        <div
          style={{
            position: "absolute",
            left: `${calibrationPoints[currentPointIndex].xPercent}%`,
            top: `${calibrationPoints[currentPointIndex].yPercent}%`,
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor:
              samplesCollected < samplesPerPoint ? "red" : "green",
            border: "2px solid white",
          }}
        />
      )}

      {/* Progress Indicator */}
      {currentPointIndex < calibrationPoints.length ? (
        <>
          <div className="mt-4 w-1/2 bg-gray-300 rounded-full">
            <div
              className="bg-green-500 text-xs leading-none py-1 text-center text-white rounded-full"
              style={{
                width: `${(samplesCollected / samplesPerPoint) * 100}%`,
              }}
            >
              {Math.round((samplesCollected / samplesPerPoint) * 100)}%
            </div>
          </div>

          {/* Current Calibration Point */}
          <p className="mt-2 text-white">
            Calibration Point {currentPointIndex + 1} of {calibrationPoints.length}
          </p>
        </>
      ) : (
        <p className="mt-2 text-white">Calibration Complete</p>
      )}
    </div>
  );
};

export default CalibrationComponent;