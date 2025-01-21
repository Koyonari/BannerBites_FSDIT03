// src/components/LayoutList/LayoutList.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import WebGazerSingleton from "../../utils/WebGazerSingleton";

// UI components
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/LayoutViewer";
import CalibrationComponent from "../AdAnalytics/CalibrationComponent";
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer";

const LayoutList = () => {
  // Layout / Error / Loading states
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI toggles
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // 1) Preload WebGazer once, NO forced .end() in cleanup
  useEffect(() => {
    let mounted = true;
    WebGazerSingleton.preload()
      .then(() => {
        if (mounted) {
          setIsModelReady(true);
          console.log(
            "[LayoutList] WebGazer model preloaded. isModelReady = true",
          );
        }
      })
      .catch((err) => {
        console.error("[LayoutList] Preload error:", err);
      });

    // IMPORTANT: remove WebGazerSingleton.end() from here:
    return () => {
      mounted = false;
      // do NOT call WebGazerSingleton.end() automatically
    };
  }, []);

  // 2) Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 3) Handle fullscreen toggles
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  // 4) Fetch layouts
  useEffect(() => {
    fetchLayouts();
  }, []);

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

  const handleLayoutSelect = async (layoutId) => {
    if (pendingLayoutIdRef.current === layoutId) return;
    pendingLayoutIdRef.current = layoutId;
    reconnectAttemptsRef.current = 0;

    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null);

      // Close old WebSocket if any
      if (websocketRef.current) {
        websocketRef.current.onclose = null;
        websocketRef.current.close();
        websocketRef.current = null;
      }

      // Fetch the layout data
      const response = await axios.get(
        `http://localhost:5000/api/layouts/${layoutId}`,
      );
      const layoutData = response.data;

      // Parse ad IDs
      const adIdsSet = new Set();
      layoutData.gridItems.forEach((item) => {
        item.scheduledAds.forEach((scheduledAd) => {
          if (scheduledAd.adId) adIdsSet.add(scheduledAd.adId);
        });
      });
      const adIds = Array.from(adIdsSet);

      // Fetch actual ads
      const adsResponse = await axios.post(
        "http://localhost:5000/api/ads/batchGet",
        { adIds },
      );
      const ads = adsResponse.data;

      // Map them
      const adsMap = {};
      ads.forEach((ad) => {
        adsMap[ad.adId] = ad;
      });

      // Attach ads to layout data
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

  // 5) Gaze logic
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

  // 6) Consent handlers
  const handleConsent = () => setHasConsent(true);
  const handleDeclineConsent = () => {
    setHasConsent(false);
    setIsTracking(false);
    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
  };

  // 7) Calibration handlers
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
    console.log("[LayoutList] Calibration completed!");
    setIsTracking(true); // Start tracking after calibration
  };

  const handleRecalibrate = () => {
    setCalibrationCompleted(false);
    setIsCalibrating(true);
  };

  // 8) End Tracking
  const handleEndTracking = () => {
    console.log("[WebGazer] Tracking ended from handleEndTracking.");
    try {
      WebGazerSingleton.end();
      setIsTracking(false);
      setRetentionTime(0);
      setIsLookingAtAd(false);
      setGazedAdId(null);
      setCurrentGazeData(null);
      console.log("[WebGazer] All resources have been reset (tracking ended).");
    } catch (error) {
      console.error("[WebGazer] Error during cleanup:", error);
    }
  };

  // 9) Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // 10) If model not ready, show a loading screen
  if (!isModelReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading Eye Tracking Model...</p>
      </div>
    );
  }

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  // Layout limit for mobile
  const MOBILE_DISPLAY_LIMIT = 3;
  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;
  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  // 11) Render the UI
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen"
    >
      <Navbar />
      <div className="container mx-auto w-full p-4 md:p-12">
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          {/* Sidebar */}
          <motion.div
            variants={fadeVariants}
            className="w-full md:w-[300px] md:flex-shrink-0"
          >
            <div className="mb-6 rounded-lg p-6 shadow neutralalt-bg md:mb-0">
              <motion.h2
                variants={itemVariants}
                className="mb-4 text-xl font-bold"
              >
                Available Layouts
              </motion.h2>

              {loading && !selectedLayout && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center p-4"
                >
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
                </motion.div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 rounded-lg p-4 alert-bg alert2-text"
                  >
                    Error: {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="space-y-2" variants={containerVariants}>
                {visibleLayouts.map((layout) => (
                  <motion.button
                    key={layout.layoutId}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${
                      selectedLayout?.layoutId === layout.layoutId
                        ? "bg-blue-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => handleLayoutSelect(layout.layoutId)}
                  >
                    {layout.name || `Layout ${layout.layoutId}`}
                  </motion.button>
                ))}

                {hasMoreLayouts && (
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2"
                    onClick={() => setShowAllLayouts(!showAllLayouts)}
                  >
                    <span>{showAllLayouts ? "Show Less" : "Show More"}</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Main layout preview */}
          <motion.div variants={fadeVariants} className="flex-1 md:ml-8">
            <div className="relative flex h-[500px] flex-col rounded-xl bg-gray-800 p-4 md:h-full md:min-h-[600px]">
              <div
                className={`relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-white ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
              >
                {" "}
                <AnimatePresence>
                  {selectedLayout && !loading && (
                    <motion.button
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: isFullscreen ? 1 : 0.7 }}
                      exit={{ opacity: 0 }}
                      onClick={toggleFullscreen}
                      className="absolute right-6 top-6 z-10 rounded-full bg-gray-800/80 p-2 text-white"
                      aria-label={
                        isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                      }
                    >
                      {isFullscreen ? "Exit FS" : "Fullscreen"}
                    </motion.button>
                  )}
                </AnimatePresence>
                <div
                  ref={previewRef}
                  className="flex h-full w-full items-center justify-center"
                >
                  <AnimatePresence mode="wait">
                    {loading && selectedLayout && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center bg-white p-4"
                      >
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
                      </motion.div>
                    )}

                    {selectedLayout && !loading && (
                      <motion.div
                        key="layout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full w-full overflow-hidden bg-white"
                      >
                        <LayoutViewer layout={selectedLayout} />
                      </motion.div>
                    )}

                    {!selectedLayout && !loading && (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full items-center justify-center bg-white p-4"
                      >
                        Select a layout to preview
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
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
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold">Viewer Analytics</h2>
            <p className="mb-2">
              <strong>Retention Time:</strong> {retentionTime} seconds
            </p>
            <p>
              <strong>Looking at Ad:</strong>{" "}
              {isLookingAtAd ? `Yes (Ad ID: ${gazedAdId})` : "No"}
            </p>
            {calibrationCompleted && (
              <div className="mt-4 rounded-lg bg-green-100 p-4">
                <p className="text-green-700">
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
    </motion.div>
  );
};

export default LayoutList;
