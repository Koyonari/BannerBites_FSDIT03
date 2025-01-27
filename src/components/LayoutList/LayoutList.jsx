import React, { useState, useEffect, useRef, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import axios from "axios";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

// UI components
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/LayoutViewer";
import CalibrationComponent from "../AdAnalytics/CalibrationComponent";
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer";

import { getPermissionsFromToken } from "../../utils/permissionsUtils";
import Cookies from "js-cookie";

const LayoutList = () => {
  // Layout / Error / Loading states
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI toggles
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line
  const [isHovering, setIsHovering] = useState(false);

  // Fullscreen logic
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef(null);

  // Eye tracking & calibration states
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);

  // Consent + analytics
  const [hasConsent, setHasConsent] = useState(false);
  const [retentionTime, setRetentionTime] = useState(0);
  const [isLookingAtAd, setIsLookingAtAd] = useState(false);
  const [gazedAdId, setGazedAdId] = useState(null);
  const [currentGazeData, setCurrentGazeData] = useState(null);

  // WebSocket references
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Constants
  const MOBILE_DISPLAY_LIMIT = 3;

  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // Fetch permissions whenever the token changes
    const token = Cookies.get("authToken");
    if (token) {
      getPermissionsFromToken(token).then(setPermissions);
    } else {
      console.warn("No auth token found.");
      setPermissions({});
    }
  }, []); // Runs only once when the component mounts

  // 1) Preload WebGazer once
  useEffect(() => {
    let mounted = true;
    WebGazerSingleton.preload()
      .then(() => {
        if (mounted) {
          setIsModelReady(true);
          console.log("[LayoutList] WebGazer model preloaded");
        }
      })
      .catch((err) => {
        console.error("[LayoutList] Preload error:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Handle window resize and fullscreen
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

  // 3) Initial layouts fetch
  useEffect(() => {
    fetchLayouts();
  }, []);

  // 4) WebSocket cleanup
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

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

      const adIdsSet = new Set();
      layoutData.gridItems.forEach((item) => {
        item.scheduledAds.forEach((scheduledAd) => {
          if (scheduledAd.adId) adIdsSet.add(scheduledAd.adId);
        });
      });
      const adIds = Array.from(adIdsSet);

      const adsResponse = await axios.post(
        "http://localhost:5000/api/ads/batchGet",
        { adIds },
      );
      const ads = adsResponse.data;

      const adsMap = {};
      ads.forEach((ad) => {
        adsMap[ad.adId] = ad;
      });

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

  const handleGazeAtAd = useCallback(
    ({ x, y }) => {
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

  // Handlers for calibration, consent, and tracking
  const handleStartCalibration = () => {
    if (!isModelReady) {
      alert("Eye Tracking model still loading, please wait...");
      return;
    }
    if (isTracking) {
      handleEndTracking();
    }
    setIsCalibrating(true);
    setCalibrationCompleted(false);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setCalibrationCompleted(true);
    setIsTracking(true);
  };

  const handleRecalibrate = () => {
    setCalibrationCompleted(false);
    setIsCalibrating(true);
  };

  const handleEndTracking = () => {
    WebGazerSingleton.end();
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
  };

  const handleConsent = () => setHasConsent(true);
  const handleDeclineConsent = () => {
    setHasConsent(false);
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
  };

  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;
  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  if (!isModelReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading Eye Tracking Model...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:dark-bg">
      <Navbar />
      <div className="container mx-auto w-full p-4 md:p-12">
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          {/* Sidebar */}
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
                          ? "primary-bg secondary-text"
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
                      onClick={() => setShowAllLayouts(!showAllLayouts)}
                    >
                      <span>{showAllLayouts ? "Show Less" : "Show More"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="font-medium alert2-text">
                  You don't have the permissions to view this content.
                </div>
              )}
            </div>
          </div>

          {/* Main layout preview */}
          <div className="flex-1 md:ml-8">
            <div
              className="relative flex h-[500px] items-center justify-center rounded-lg border-8 p-4 secondary-border md:h-full md:min-h-[600px]"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {selectedLayout && !loading && (
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
                className={`h-full w-full overflow-hidden rounded-lg bg-white ${
                  isFullscreen ? "flex items-center justify-center" : ""
                }`}
              >
                {loading && selectedLayout && (
                  <div className="flex h-full items-center justify-center p-4 light-bg">
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
        <div className="mt-8 flex justify-center space-x-3 px-4">
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

          {/* End Tracking */}
          {isTracking && (
            <button
              onClick={handleEndTracking}
              className="rounded-lg bg-red-500 px-6 py-2.5 text-white transition hover:bg-red-600"
            >
              End Tracking
            </button>
          )}

          {/* Consent */}
          {!hasConsent && (
            <>
              <button
                onClick={handleConsent}
                className="rounded-lg bg-green-500 px-6 py-2.5 text-white transition hover:bg-green-600"
              >
                Consent to Eye Tracking
              </button>
              <button
                onClick={handleDeclineConsent}
                className="rounded-lg bg-gray-500 px-6 py-2.5 text-white transition hover:bg-gray-600"
              >
                Decline
              </button>
            </>
          )}
        </div>

        {/* Viewer Analytics */}
        {selectedLayout && hasConsent && (
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
      {isTracking && selectedLayout && hasConsent && (
        <GazeTrackingComponent onGaze={handleGazeAtAd} isActive={isTracking} />
      )}

      {/* Gaze Visualizer */}
      {currentGazeData && <GazeVisualizer gazeData={currentGazeData} />}
    </div>
  );
};

export default LayoutList;
