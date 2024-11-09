// src/components/LayoutList.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/AdViewer"; 
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer"; 
import CalibrationComponent from "../AdAnalytics/CalibrationComponent"; // Adjusted import path
import webgazer from "webgazer"; 

const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Tracking states
  const [isTracking, setIsTracking] = useState(false);
  const [retentionTime, setRetentionTime] = useState(0);
  const [isLookingAtAd, setIsLookingAtAd] = useState(false);
  const [gazedAdId, setGazedAdId] = useState(null); // Track which ad is being gazed at

  // Consent state
  const [hasConsent, setHasConsent] = useState(false);

  // Gaze data for visualization
  const [currentGazeData, setCurrentGazeData] = useState(null);

  // Gaze history for smoothing (useRef instead of useState to prevent stale closures)
  const gazeHistoryRef = useRef([]);

  // Calibration states
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);

  useEffect(() => {
    fetchLayouts();

    return () => {
      // Cleanup WebSocket when component unmounts
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:5000/api/layouts");
      if (!response.ok) {
        throw new Error("Failed to fetch layouts");
      }
      const data = await response.json();
      setLayouts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutSelect = async (layoutId) => {
    if (pendingLayoutIdRef.current === layoutId) {
      // If this layout is already pending, ignore the repeated request.
      return;
    }
    pendingLayoutIdRef.current = layoutId;
    reconnectAttemptsRef.current = 0;

    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null);
      setIsTracking(false);
      setRetentionTime(0);
      setIsLookingAtAd(false);
      setGazedAdId(null); // Reset gazed ad
      gazeHistoryRef.current = []; // Reset gaze history
      setCalibrationCompleted(false); // Reset calibration status

      // Close the previous WebSocket connection if one exists
      if (websocketRef.current) {
        websocketRef.current.onclose = null;
        websocketRef.current.close();
        websocketRef.current = null;
      }

      // Fetch the initial layout data
      const response = await fetch(`http://localhost:5000/api/layouts/${layoutId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch layout details for layoutId: ${layoutId}`);
      }
      const data = await response.json();
      console.log("[LayoutList] Fetched layout data:", data);
      setSelectedLayout(data);

      // Set up WebSocket connection for real-time updates
      establishWebSocketConnection(layoutId);
      // Do not set isTracking here; wait for calibration
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      pendingLayoutIdRef.current = null;
    }
  };

  const establishWebSocketConnection = (layoutId) => {
    websocketRef.current = new WebSocket("ws://localhost:5000");

    websocketRef.current.onopen = () => {
      console.log("[FRONTEND] Connected to WebSocket server");
      websocketRef.current.send(JSON.stringify({ type: "subscribe", layoutId }));
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log("[FRONTEND] Received WebSocket message:", parsedData);

        if (
          (parsedData.type === "layoutUpdate" || parsedData.type === "layoutData") &&
          parsedData.data.layoutId === layoutId
        ) {
          // Update the layout with the received data
          setSelectedLayout(parsedData.data);
          console.log("[FRONTEND] Layout updated via WebSocket:", parsedData.data);
        }
      } catch (e) {
        console.error("[FRONTEND] Error parsing WebSocket message:", e);
      }
    };

    websocketRef.current.onclose = (event) => {
      console.log("[FRONTEND] WebSocket connection closed. Reason:", event.reason);
      if (
        pendingLayoutIdRef.current === layoutId &&
        reconnectAttemptsRef.current < 5
      ) {
        // Attempt to reconnect only if this layoutId is still active and attempts are below threshold
        reconnectAttemptsRef.current += 1;
        setTimeout(() => {
          console.log(
            `[FRONTEND] Reconnecting to WebSocket server... Attempt #${reconnectAttemptsRef.current}`
          );
          establishWebSocketConnection(layoutId);
        }, 5000);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error("[FRONTEND] WebSocket error:", error);
    };
  };

  const handleGazeAtAd = useCallback(({ x, y }) => {
    const adElements = document.querySelectorAll(".ad-item");
    let gazedAtAdId = null;

    adElements.forEach((adElement) => {
      const rect = adElement.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        gazedAtAdId = adElement.getAttribute("data-ad-id");
      }
    });

    if (gazedAtAdId !== gazedAdId) {
      // Reset retention time if gazed ad changes
      setRetentionTime(0);
    }

    if (gazedAtAdId) {
      setIsLookingAtAd(true);
      setGazedAdId(gazedAtAdId);
      setCurrentGazeData({ x, y });
    } else {
      setIsLookingAtAd(false);
      setGazedAdId(null);
      setCurrentGazeData({ x, y });
    }
  }, [gazedAdId]);

  useEffect(() => {
    let interval = null;
    if (isTracking && isLookingAtAd) {
      interval = setInterval(() => {
        setRetentionTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking, isLookingAtAd]);

  const handleConsent = () => {
    setHasConsent(true);
    if (selectedLayout) {
      // Optionally, start calibration or other processes
    }
  };

  const handleDeclineConsent = () => {
    setHasConsent(false);
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
  };

  // Calibration Handlers
  const handleStartCalibration = () => {
    if (isTracking) {
      handleEndTracking();
    }
    setIsCalibrating(true);
    setCalibrationCompleted(false);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setCalibrationCompleted(true);
    // Start gaze tracking after calibration
    setIsTracking(true);
  };

  const handleEndTracking = () => {
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
    // End WebGazer tracking if initialized
  if (webgazer) {
    webgazer.end();
    console.log("[WebGazer] Tracking ended from handleEndTracking.");
  }
  };

  
  return (
    <>
      <Navbar />
      <div className="container p-4">
        {!hasConsent && (
          <div className="consent p-4 bg-yellow-100 rounded-lg mb-4">
            <p className="mb-2">
              This application uses your webcam to track gaze for enhancing your
              advertisement experience. Do you consent to enable gaze tracking?
            </p>
            <button
              onClick={handleConsent}
              className="px-4 py-2 bg-green-500 text-white rounded-lg mr-2"
            >
              Yes, I Consent
            </button>
            <button
              onClick={handleDeclineConsent}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              No, Thanks
            </button>
          </div>
        )}
        {hasConsent && (
          <>
            <div className="grid md:flex md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow md:w-[20vw]">
                <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
                {loading && !selectedLayout && (
                  <div className="flex items-center justify-center p-4 text-gray-600">
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading layouts...
                  </div>
                )}
                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
                    Error: {error}
                  </div>
                )}
                <div className="space-y-2">
                  {layouts.map((layout) => (
                    <button
                      key={layout.layoutId}
                      className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                        selectedLayout?.layoutId === layout.layoutId
                          ? "bg-orange-600 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleLayoutSelect(layout.layoutId)}
                    >
                      {layout.name || `Layout ${layout.layoutId}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-[2vw] flex h-[80vh] w-[80vw] items-center justify-center rounded-lg border-8 border-gray-800 bg-black p-4 shadow-lg">
                <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg bg-white shadow-inner">
                  {loading && selectedLayout && (
                    <div className="flex items-center justify-center p-4 text-gray-600">
                      <svg
                        className="mr-2 h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading layout preview...
                    </div>
                  )}
                  {selectedLayout && !loading && (
                    <LayoutViewer layout={selectedLayout} />
                  )}
                  {!selectedLayout && !loading && (
                    <div className="p-4 text-center text-gray-500">
                      Select a layout to preview
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calibration and Tracking Controls */}
            <div className="mt-4 flex space-x-2">
              {!isCalibrating && (
                <button
                  onClick={handleStartCalibration}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                  disabled={isCalibrating || isTracking || !selectedLayout}
                >
                  Start Calibration
                </button>
              )}
              {isTracking && (
                <button
                  onClick={handleEndTracking}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  End Tracking
                </button>
              )}
            </div>

            {/* Viewer Analytics Section */}
            {selectedLayout && hasConsent && (
              <div className="mt-8 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold">Viewer Analytics</h2>
                <p className="mb-2">
                  <strong>Retention Time:</strong> {retentionTime} seconds
                </p>
                <p>
                  <strong>Looking at Ad:</strong> {isLookingAtAd ? `Yes (Ad ID: ${gazedAdId})` : "No"}
                </p>
                {calibrationCompleted && (
                  <div className="mt-4 p-4 bg-green-100 rounded-lg">
                    <p className="text-green-700">Calibration was successfully completed.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Render CalibrationComponent */}
      {isCalibrating && (
        <CalibrationComponent onCalibrationComplete={handleCalibrationComplete} />
      )}

      {/* Render GazeTrackingComponent only when tracking is active, not calibrating, and calibration is completed */}
      {isTracking && !isCalibrating && calibrationCompleted && selectedLayout && hasConsent && (
        <GazeTrackingComponent onGazeAtAd={handleGazeAtAd} isActive={isTracking} />
      )}

      {/* Render GazeVisualizer */}
      {currentGazeData && <GazeVisualizer gazeData={currentGazeData} />}
    </>
  );
};

export default LayoutList;
