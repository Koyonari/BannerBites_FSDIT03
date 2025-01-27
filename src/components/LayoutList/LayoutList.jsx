// src/components/AdAnalytics/LayoutList.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid"; // For unique adSessionId
import { Maximize2, Minimize2 } from "lucide-react";
import Cookies from "js-cookie";
import axios from "axios";

// UI components
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/LayoutViewer";
import CalibrationComponent from "../AdAnalytics/CalibrationComponent";
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer";

import WebGazerSingleton from "../../utils/WebGazerSingleton";
import { getPermissionsFromToken } from "../../utils/permissionsUtils";

const LayoutList = () => {
  // ===== Layouts, Errors, Loading =====
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===== UI Toggles =====
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false); // show fullscreen button

  // ===== Fullscreen Logic =====
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef(null);

  // ===== Eye Tracking & Calibration States =====
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);

  // ===== Analytics (basic) =====
  const [retentionTime, setRetentionTime] = useState(0);
  const [isLookingAtAd, setIsLookingAtAd] = useState(false);
  const [gazedAdId, setGazedAdId] = useState(null);
  const [currentGazeData, setCurrentGazeData] = useState(null);

  // ===== More Advanced Session Tracking =====
  const activeAdSessionRef = useRef(null); // holds the current ad session object
  const gazeSamplingIntervalRef = useRef(null); // interval ID for sampling
  const lastGazeRef = useRef({ x: 0, y: 0 }); // store the most recent gaze

  // ===== Bounding Box Overlays =====
  const [adBoundingBoxes, setAdBoundingBoxes] = useState([]);
  const [showBorders, setShowBorders] = useState(false);

  // ===== Toggles =====
  const [showCamera, setShowCamera] = useState(true); // toggle camera feed
  const [showVisualizer, setShowVisualizer] = useState(true); // toggle gaze dot

  // ===== WebSocket =====
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // ===== Constants =====
  const MOBILE_DISPLAY_LIMIT = 3;

  // ===== Permissions =====
  const [permissions, setPermissions] = useState({});

  // ---------------------------------------------
  // 1) Fetch User Permissions
  // ---------------------------------------------
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      getPermissionsFromToken(token).then(setPermissions);
    } else {
      console.warn("No auth token found.");
      setPermissions({});
    }
  }, []);

  // ---------------------------------------------
  // 2) Preload WebGazer Model
  // ---------------------------------------------
  useEffect(() => {
    let mounted = true;
    WebGazerSingleton.preload()
      .then(() => {
        if (!mounted) return;
        setIsModelReady(true);
        console.log("[LayoutList] WebGazer model preloaded");

        // If we have saved calibration data, skip calibration
        if (WebGazerSingleton.hasSavedCalibration()) {
          console.log("Existing calibration found; skipping calibration step.");
          setCalibrationCompleted(true);
        }
      })
      .catch((err) => {
        console.error("[LayoutList] Preload error:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------------
  // 3) Handle Window Resize & Fullscreen
  // ---------------------------------------------
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    handleResize();
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // ---------------------------------------------
  // 4) Fetch Layouts on Mount
  // ---------------------------------------------
  useEffect(() => {
    fetchLayouts();
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // ---------------------------------------------
  // 5) Fetch Layouts & Establish WebSocket
  // ---------------------------------------------
  const fetchLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/layouts");
      setLayouts(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const establishWebSocketConnection = (layoutId) => {
    websocketRef.current = new WebSocket("ws://localhost:5000");

    websocketRef.current.onopen = () => {
      websocketRef.current.send(
        JSON.stringify({ type: "subscribe", layoutId }),
      );
    };

    websocketRef.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (
          (parsedData.type === "layoutUpdate" ||
            parsedData.type === "layoutData") &&
          parsedData.data.layoutId === layoutId
        ) {
          setSelectedLayout(parsedData.data);
        }
      } catch (e) {
        console.error("[LayoutList] WS parse error:", e);
      }
    };

    websocketRef.current.onclose = () => {
      // Attempt to reconnect a few times
      if (
        pendingLayoutIdRef.current === layoutId &&
        reconnectAttemptsRef.current < 5
      ) {
        reconnectAttemptsRef.current += 1;
        setTimeout(() => establishWebSocketConnection(layoutId), 5000);
      }
    };

    websocketRef.current.onerror = (error) => {
      console.error("[LayoutList] WebSocket error:", error);
    };
  };

  const handleLayoutSelect = async (layoutId) => {
    if (pendingLayoutIdRef.current === layoutId) return;
    pendingLayoutIdRef.current = layoutId;
    reconnectAttemptsRef.current = 0;

    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null);

      if (websocketRef.current) {
        websocketRef.current.onclose = null;
        websocketRef.current.close();
        websocketRef.current = null;
      }

      const response = await axios.get(
        `http://localhost:5000/api/layouts/${layoutId}`,
      );
      const layoutData = response.data;

      // Gather all adIds
      const adIdsSet = new Set();
      layoutData.gridItems.forEach((item) => {
        item.scheduledAds.forEach((scheduledAd) => {
          if (scheduledAd.adId) adIdsSet.add(scheduledAd.adId);
        });
      });
      const adIds = Array.from(adIdsSet);

      // Fetch full Ad objects
      const adsResponse = await axios.post(
        "http://localhost:5000/api/ads/batchGet",
        { adIds },
      );
      const ads = adsResponse.data;
      const adsMap = {};
      ads.forEach((ad) => {
        adsMap[ad.adId] = ad;
      });

      // Attach each ad object to the layout items
      layoutData.gridItems = layoutData.gridItems.map((item) => {
        const updatedScheduledAds = item.scheduledAds.map((scheduledAd) => ({
          ...scheduledAd,
          ad: adsMap[scheduledAd.adId] || null,
        }));
        return { ...item, scheduledAds: updatedScheduledAds };
      });

      setSelectedLayout(layoutData);
      establishWebSocketConnection(layoutId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      pendingLayoutIdRef.current = null;
    }
  };

  // ---------------------------------------------
  // 6) Bounding Box Logic
  // ---------------------------------------------
  const updateAdBoundingBoxes = useCallback(() => {
    const boxes = [];
    document.querySelectorAll(".ad-item").forEach((el) => {
      const rect = el.getBoundingClientRect();
      boxes.push({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    });
    setAdBoundingBoxes(boxes);
  }, []);

  useEffect(() => {
    updateAdBoundingBoxes();
    window.addEventListener("resize", updateAdBoundingBoxes);
    return () => {
      window.removeEventListener("resize", updateAdBoundingBoxes);
    };
  }, [updateAdBoundingBoxes, selectedLayout]);

  const toggleBorders = () => setShowBorders((prev) => !prev);

  // ---------------------------------------------
  // 7) Ad Session Handling (Enter/Exit, Gaze Samples)
  // ---------------------------------------------
  const startAdSession = (adId) => {
    const now = Date.now();
    const newSession = {
      adSessionId: uuidv4(),
      adId,
      enterTime: now,
      exitTime: null,
      dwellTime: null,
      gazeSamples: [],
    };
    activeAdSessionRef.current = newSession;

    // Start sampling every 200ms
    gazeSamplingIntervalRef.current = setInterval(() => {
      if (!activeAdSessionRef.current) return;
      const { x, y } = lastGazeRef.current;
      const t = Date.now();
      // Append a sample
      activeAdSessionRef.current.gazeSamples.push({ x, y, timestamp: t });
    }, 200);
  };

  const endAdSession = () => {
    if (!activeAdSessionRef.current) return;
    const now = Date.now();
    const session = activeAdSessionRef.current;
    session.exitTime = now;
    session.dwellTime = session.exitTime - session.enterTime;

    // Clear the interval
    if (gazeSamplingIntervalRef.current) {
      clearInterval(gazeSamplingIntervalRef.current);
      gazeSamplingIntervalRef.current = null;
    }

    // Send this session data once, via WebSocket
    sendAdSessionToServer(session);

    // Clear ref
    activeAdSessionRef.current = null;
  };

  const sendAdSessionToServer = (session) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      const payload = {
        type: "adSessionComplete",
        data: {
          ...session,
          // Convert times to ISO if desired
          enterTime: new Date(session.enterTime).toISOString(),
          exitTime: new Date(session.exitTime).toISOString(),
        },
      };
      websocketRef.current.send(JSON.stringify(payload));
      console.log("[LayoutList] Sent adSessionComplete:", payload);
    } else {
      console.warn("WebSocket not open; cannot send session data.");
    }
  };

  // ---------------------------------------------
  // 8) Gaze Event Handling
  // ---------------------------------------------
  const handleGazeAtAd = useCallback(
    ({ x, y }) => {
      // Always store last gaze
      lastGazeRef.current = { x, y };

      // Basic bounding box check
      const adElements = document.querySelectorAll(".ad-item");
      let foundAdId = null;
      adElements.forEach((adElement) => {
        const rect = adElement.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          foundAdId = adElement.getAttribute("data-ad-id");
        }
      });

      // If we've changed ads (or left ads altogether)
      const currentSession = activeAdSessionRef.current;
      const currentAdId = currentSession?.adId || null;

      if (foundAdId !== currentAdId) {
        // 1) End the old session if there was one
        if (currentSession) {
          endAdSession();
        }

        // 2) Start a new session if we're now in a new ad
        if (foundAdId) {
          startAdSession(foundAdId);
        }
      }

      // Also maintain your simpler “Looking at Ad” states
      if (foundAdId !== gazedAdId) {
        setRetentionTime(0);
      }
      if (foundAdId) {
        setIsLookingAtAd(true);
        setGazedAdId(foundAdId);
      } else {
        setIsLookingAtAd(false);
        setGazedAdId(null);
      }
      setCurrentGazeData({ x, y });
    },
    [gazedAdId],
  );

  // ---------------------------------------------
  // 9) Calibration / Tracking Handlers
  // ---------------------------------------------
  const handleStartCalibration = () => {
    if (!isModelReady) {
      alert("Eye Tracking model still loading, please wait...");
      return;
    }
    if (isTracking) handleEndTracking();
    setIsCalibrating(true);
    setCalibrationCompleted(false);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setCalibrationCompleted(true);
    setIsTracking(true);

    // Save calibration data
    WebGazerSingleton.saveCalibrationDataToCookie();
  };

  const handleRecalibrate = () => {
    WebGazerSingleton.resetCalibrationData();
    setCalibrationCompleted(false);
    setIsCalibrating(true);
  };

  // ---------------------------------------------
  // 10) Start / Resume / End Eye Tracking
  // ---------------------------------------------
  const handleStartTracking = async () => {
    console.log("[LayoutList] Start Eye Tracking clicked.");
    if (!isModelReady) {
      alert("Eye Tracking model still loading, please wait...");
      return;
    }
    // Must have calibration
    if (!WebGazerSingleton.hasSavedCalibration() && !calibrationCompleted) {
      alert("You must calibrate before starting eye tracking.");
      return;
    }

    try {
      await WebGazerSingleton.initialize((data) => {
        if (data) handleGazeAtAd(data);
      });
      setIsTracking(true);
      console.log("[LayoutList] Eye Tracking started with calibration data.");

      // Toggle camera feed if desired
      WebGazerSingleton.setCameraVisibility(showCamera);
    } catch (err) {
      console.error("Failed to start tracking:", err);
    }
  };

  const handleResumeTracking = async () => {
    if (!isModelReady) {
      alert("Eye Tracking model still loading, please wait...");
      return;
    }
    if (!calibrationCompleted) {
      alert("You must calibrate before resuming tracking.");
      return;
    }

    try {
      await WebGazerSingleton.initialize((data) => {
        if (data) handleGazeAtAd(data);
      });
      setIsTracking(true);
      console.log("[LayoutList] Eye Tracking resumed.");
      WebGazerSingleton.setCameraVisibility(showCamera);
    } catch (err) {
      console.error("Failed to resume tracking:", err);
    }
  };

  const handleEndTracking = () => {
    // End any active ad session first
    if (activeAdSessionRef.current) {
      endAdSession();
    }

    // Then stop WebGazer
    WebGazerSingleton.end();
    setIsTracking(false);

    // Reset simple states
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
  };

  // ---------------------------------------------
  // 11) UI Toggles
  // ---------------------------------------------
  const handleToggleCamera = () => {
    const newVal = !showCamera;
    setShowCamera(newVal);
    if (isTracking && WebGazerSingleton.instance) {
      WebGazerSingleton.setCameraVisibility(newVal);
    }
  };

  const handleToggleVisualizer = () => setShowVisualizer((prev) => !prev);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await previewRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // ---------------------------------------------
  // 12) Layouts Display Logic
  // ---------------------------------------------
  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;
  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  return (
    <div className="min-h-screen dark:dark-bg">
      <Navbar />

      <div className="container mx-auto w-full p-4 md:p-12">
        {/* Layout Selection + Preview */}
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          {/* Sidebar: Layouts */}
          <div className="w-full md:w-[300px] md:flex-shrink-0">
            <div className="mb-6 rounded-lg p-6 shadow light-bg dark:dark-bg dark:secondary-text md:mb-0">
              <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
              {loading && !selectedLayout && (
                <div className="flex items-center justify-center p-4 neutral-text">
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
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
                <div className="mb-4 rounded-lg p-4 alert-bg alert2-text">
                  Error: {error}
                </div>
              )}

              {permissions?.createAds ? (
                <div className="space-y-2">
                  {visibleLayouts.map((layout) => (
                    <button
                      key={layout.layoutId}
                      className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                        selectedLayout?.layoutId === layout.layoutId
                          ? "secondary-bg secondary-text"
                          : "neutral-bg primary-text hover:neutralalt-bg"
                      }`}
                      onClick={() => handleLayoutSelect(layout.layoutId)}
                    >
                      {layout.name || `Layout ${layout.layoutId}`}
                    </button>
                  ))}
                  {hasMoreLayouts && (
                    <button
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors neutral-bg neutral-text hover:neutral-bg"
                      onClick={() => setShowAllLayouts((prev) => !prev)}
                    >
                      <span>{showAllLayouts ? "Show Less" : "Show More"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="font-medium text-red-500">
                  You don't have permission to view this content.
                </div>
              )}
            </div>
          </div>

          {/* Main Layout Preview */}
          <div className="flex-1 md:ml-8">
            <div
              className="relative flex h-[500px] items-center justify-center rounded-lg border-8 p-4 secondary-border md:h-full md:min-h-[600px]"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Fullscreen Button */}
              {selectedLayout && !loading && isHovering && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute right-6 top-6 z-10 rounded-full bg-gray-600 p-2 text-white hover:bg-gray-800"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
              )}
              <div
                ref={previewRef}
                className={`h-full w-full overflow-hidden rounded-lg light-bg ${
                  isFullscreen ? "flex items-center justify-center" : ""
                }`}
              >
                {loading && selectedLayout && (
                  <div className="flex h-full items-center justify-center p-4 neutral-bg">
                    <svg
                      className="mr-2 h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
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
                  <div className="flex h-full items-center justify-center p-4 neutral-text">
                    Select a layout to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calibration & Tracking Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 px-4">
          {/* Start Calibration */}
          {!isCalibrating && !calibrationCompleted && (
            <button
              onClick={handleStartCalibration}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-white transition hover:bg-blue-600"
              disabled={isCalibrating || isTracking || !selectedLayout}
            >
              Start Calibration
            </button>
          )}

          {/* Recalibrate */}
          <button
            onClick={handleRecalibrate}
            className="rounded-lg bg-yellow-500 px-6 py-2.5 text-white transition hover:bg-yellow-600"
            disabled={!selectedLayout}
          >
            Recalibrate
          </button>

          {/* Start Eye Tracking */}
          {!isTracking && (
            <button
              onClick={handleStartTracking}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-white transition hover:bg-blue-600"
              disabled={
                !selectedLayout ||
                !(
                  WebGazerSingleton.hasSavedCalibration() ||
                  calibrationCompleted
                )
              }
            >
              Start Eye Tracking
            </button>
          )}

          {/* End Tracking */}
          {isTracking && (
            <button
              onClick={handleEndTracking}
              className="rounded-lg bg-red-500 px-6 py-2.5 text-white transition hover:bg-red-600"
            >
              End Tracking
            </button>
          )}

          {/* Resume Tracking */}
          {!isTracking && calibrationCompleted && (
            <button
              onClick={handleResumeTracking}
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-white transition hover:bg-blue-600"
              disabled={!selectedLayout}
            >
              Resume Eye Tracking
            </button>
          )}

          {/* Toggle Bounding Box Borders */}
          <button
            onClick={toggleBorders}
            className="rounded-lg bg-gray-500 px-6 py-2.5 text-white transition hover:bg-gray-600"
          >
            {showBorders ? "Hide Borders" : "Show Borders"}
          </button>

          {/* Toggle Camera Feed */}
          <button
            onClick={handleToggleCamera}
            className="rounded-lg bg-gray-500 px-6 py-2.5 text-white transition hover:bg-gray-600"
          >
            {showCamera ? "Hide Camera" : "Show Camera"}
          </button>

          {/* Toggle Gaze Visualizer */}
          <button
            onClick={handleToggleVisualizer}
            className="rounded-lg bg-gray-500 px-6 py-2.5 text-white transition hover:bg-gray-600"
          >
            {showVisualizer ? "Hide Gaze Dot" : "Show Gaze Dot"}
          </button>
        </div>

        {/* Viewer Analytics (basic) */}
        {selectedLayout && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">Viewer Analytics</h2>
            <p className="mb-2">
              <strong>Retention Time:</strong> {retentionTime} seconds
            </p>
            <p>
              <strong>Looking at Ad:</strong>{" "}
              {isLookingAtAd ? `Yes (Ad ID: ${gazedAdId})` : "No"}
            </p>
            {calibrationCompleted && (
              <div className="mt-4 rounded-lg bg-green-100 p-4 dark:bg-green-900">
                <p className="text-green-700 dark:text-green-200">
                  Calibration was successfully completed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calibration Overlay */}
      {isCalibrating && (
        <CalibrationComponent
          onCalibrationComplete={handleCalibrationComplete}
        />
      )}

      {/* Gaze Tracking */}
      {isTracking && selectedLayout && (
        <GazeTrackingComponent onGaze={handleGazeAtAd} isActive={isTracking} />
      )}

      {/* Gaze Visualizer */}
      {showVisualizer && currentGazeData && (
        <GazeVisualizer
          gazeData={currentGazeData}
          boundingBoxes={adBoundingBoxes}
          showBorders={showBorders}
        />
      )}
    </div>
  );
};

export default LayoutList;
