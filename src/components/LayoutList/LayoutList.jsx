import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/AdViewer";
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer";

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
  const [gazedAdId, setGazedAdId] = useState(null);

  // Consent state
  const [hasConsent, setHasConsent] = useState(false);

  // Gaze data for visualization
  const [currentGazeData, setCurrentGazeData] = useState(null);

  // Gaze points to be sent to backend
  const [gazePoints, setGazePoints] = useState([]);

  useEffect(() => {
    fetchLayouts();

    return () => {
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
      setGazedAdId(null);

      if (websocketRef.current) {
        websocketRef.current.onclose = null;
        websocketRef.current.close();
        websocketRef.current = null;
      }

      const response = await fetch(`http://localhost:5000/api/layouts/${layoutId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch layout details for layoutId: ${layoutId}`);
      }
      const data = await response.json();
      console.log("[LayoutList] Fetched layout data:", data);
      setSelectedLayout(data);

      establishWebSocketConnection(layoutId);
      setIsTracking(true);
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

  // Gaze data handler to accumulate gaze points
  const handleGazeAtAd = useCallback(
    ({ x, y }) => {
      const gazePoint = { x, y, timestamp: Date.now() };
      setGazePoints((prevPoints) => [...prevPoints, gazePoint]);
      setCurrentGazeData({ x, y });
    },
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (gazePoints.length > 0) {
        sendGazeDataToBackend(gazePoints);
        setGazePoints([]);
      }
    }, 5000); // Send every 5 seconds

    return () => clearInterval(interval);
  }, [gazePoints]);

  const sendGazeDataToBackend = async (gazeDataArray) => {
    try {
      const response = await fetch("http://localhost:5000/api/gaze-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gazeData: gazeDataArray }),
      });
      if (!response.ok) {
        throw new Error("Failed to send gaze data to backend");
      }
      console.log("[Gaze Data Sent]", gazeDataArray);
    } catch (error) {
      console.error("[Gaze Data Error]", error);
    }
  };

  // Handle consent for gaze tracking
  const handleConsent = () => {
    setHasConsent(true);
  };

  const handleDeclineConsent = () => {
    setHasConsent(false);
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
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
          <div className="grid md:flex md:grid-cols-2">
            {/* Layout Selection */}
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

            {/* Layout Viewer */}
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
        )}

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
          </div>
        )}
      </div>

      {/* Render GazeTrackingComponent only if tracking */}
      {isTracking && selectedLayout && hasConsent && (
        <GazeTrackingComponent onGazeAtAd={handleGazeAtAd} isActive={isTracking} />
      )}
      {currentGazeData && <GazeVisualizer gazeData={currentGazeData} />}
    </>
  );
};

export default LayoutList;
