// src/components/LayoutList/LayoutList.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  Camera,
  Grid,
  Activity,
  RefreshCw,
  PlayCircle,
  StopCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Cookies from "js-cookie";
import axios from "axios";

// UI Components
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/LayoutViewer";
import CalibrationComponent from "../AdAnalytics/CalibrationComponent";
import GazeTrackingComponent from "../AdAnalytics/GazeTrackingComponent";
import GazeVisualizer from "../AdAnalytics/GazeVisualizer";
import HeatmapOverlay from "../AdAnalytics/HeatmapOverlay";
import ErrorBoundary from "../ErrorBoundary";

// Services
import { fetchSessionDataByAdIds } from "../../services/heatmapService";

// Utils
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
  const [isHovering, setIsHovering] = useState(false); // For fullscreen button
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // ===== Fullscreen Logic =====
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef(null);

  // ===== Eye Tracking & Calibration =====
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);

  // ===== Basic Analytics =====
  const [retentionTime, setRetentionTime] = useState(0);
  const [isLookingAtAd, setIsLookingAtAd] = useState(false);
  const [gazedAdId, setGazedAdId] = useState(null);
  const [currentGazeData, setCurrentGazeData] = useState(null);

  // ===== Advanced Session Tracking =====
  const activeAdSessionRef = useRef(null);
  const gazeSamplingIntervalRef = useRef(null);
  const lastGazeRef = useRef({ x: 0, y: 0 });

  // ===== Bounding Box Overlays =====
  const [adBoundingBoxes, setAdBoundingBoxes] = useState([]);
  const [showBorders, setShowBorders] = useState(false);

  // ===== Toggles =====
  const [showCamera, setShowCamera] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(true);

  // ===== WebSocket & Refs =====
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // ===== Constants =====
  const MOBILE_DISPLAY_LIMIT = 3;

  // ===== Permissions =====
  const [permissions, setPermissions] = useState({});

  // ===== Heatmap & Aggregates =====
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState([]);
  const [layoutDimensions, setLayoutDimensions] = useState({
    width: 0,
    height: 0,
  });
  const layoutContainerRef = useRef(null);

  // The aggregator data array for all ads in the layout
  const [aggregateData, setAggregateData] = useState(null);

  //---------------------------------------
  // 1) Fetch User Permissions
  //---------------------------------------
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      getPermissionsFromToken(token).then(setPermissions);
    } else {
      console.warn("No auth token found.");
      setPermissions({});
    }
  }, []);

  //---------------------------------------
  // 2) Preload WebGazer Model
  //---------------------------------------
  useEffect(() => {
    // Preload the model as soon as possible
    let mounted = true;
    WebGazerSingleton.preload()
      .then(() => {
        if (!mounted) return;
        setIsModelReady(true);
        console.log("[LayoutList] WebGazer model preloaded");

        // If the user had previously saved calibration, set the flag
        if (WebGazerSingleton.hasSavedCalibration()) {
          console.log(
            "[LayoutList] Found saved calibration data in localStorage.",
          );
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

  //---------------------------------------
  // 3) Handle Window Resize & Fullscreen
  //---------------------------------------
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

  //---------------------------------------
  // 4) Fetch Layouts on Mount
  //---------------------------------------
  useEffect(() => {
    fetchLayouts();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (gazeSamplingIntervalRef.current) {
        clearInterval(gazeSamplingIntervalRef.current);
      }

      // **Ensure WebGazer's red dot is hidden on unmount**
      WebGazerSingleton.showPredictionPoints(false);
    };
  }, []);

  //---------------------------------------
  // 5) Fetch Layouts (HTTP)
  //---------------------------------------
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

  //---------------------------------------
  // 6) Select Layout & Prepare Heatmap
  //---------------------------------------
  const handleLayoutSelect = async (layoutId) => {
    if (pendingLayoutIdRef.current === layoutId) return;
    pendingLayoutIdRef.current = layoutId;
    reconnectAttemptsRef.current = 0;

    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null);

      // If we had an active WebSocket for another layout, close it
      if (websocketRef.current) {
        websocketRef.current.onclose = null;
        websocketRef.current.close();
        websocketRef.current = null;
      }

      // 1) Fetch layout info
      const response = await axios.get(
        `http://localhost:5000/api/layouts/${layoutId}`
      );
      const layoutData = response.data;

      // 2) Extract all adIds from gridItems
      const adIdsSet = new Set();
      layoutData.gridItems.forEach((item) => {
        item.scheduledAds.forEach((scheduledAd) => {
          if (scheduledAd.adId) adIdsSet.add(scheduledAd.adId);
        });
      });
      const adIds = Array.from(adIdsSet);

      // 3) Update local state with the new layout
      setSelectedLayout({ ...layoutData, adIds });

      // 4) Fetch static heatmap data for all ads
      await fetchHeatmapData(adIds);

      // 4.1) Then fetch aggregator data for each adId from the decoupled endpoint
      const aggPromises = adIds.map((id) => fetchAggregateData(id));
      const results = await Promise.all(aggPromises);
      const allAggregates = results.filter((item) => item !== null);
      setAggregateData(allAggregates);

      // 5) Establish WebSocket for real-time updates
      establishHeatmapWebSocketConnection(layoutId, adIds);

      console.log(
        "Layout selected and heatmap data fetching initiated:",
        layoutId
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error selecting layout:", err);
    } finally {
      setLoading(false);
      pendingLayoutIdRef.current = null;
    }
  };

  // Example function to fetch aggregator data by adId
  const fetchAggregateData = async (adId) => {
    try {
      console.log("[LayoutList] Fetching aggregator for adId:", adId);
      // Updated URL to use the decoupled adAggregate endpoint
      const res = await axios.get(
        `http://localhost:5000/api/adAggregates/aggregates/${adId}`
      );
      return res.data; // e.g. { adId, totalDwellTime, totalGazeSamples, totalSessions, ... }
    } catch (error) {
      console.error("[LayoutList] aggregator fetch error:", error);
      return null;
    }
  };

  //---------------------------------------
  // 7) Fetch Heatmap Data (HTTP)
  //---------------------------------------
  const fetchHeatmapData = async (adIds) => {
    if (!adIds || adIds.length === 0) return;
    try {
      const response = await fetchSessionDataByAdIds(adIds);
      if (response && response.sessions) {
        const points = response.sessions.flatMap((session) =>
          session.gazeSamples.map((sample) => ({
            x: sample.x,
            y: sample.y,
            value: sample.value || 1,
          })),
        );
        setHeatmapData(points);
        console.log("Heatmap data fetched:", points);
      }
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
    }
  };

  //---------------------------------------
  // 7.1) Establish Heatmap WebSocket
  //---------------------------------------
  const establishHeatmapWebSocketConnection = (layoutId, adIds) => {
    if (!layoutId) {
      console.error("[LayoutList] layoutId is undefined. Cannot subscribe for layout updates.");
      return;
    }
    if (!adIds || adIds.length === 0) return;
    
    console.log("[LayoutList] Opening heatmap WebSocket...");
  
    const ws = new WebSocket("ws://localhost:5000");
    websocketRef.current = ws;
  
    ws.onopen = () => {
      console.log("[LayoutList] Heatmap WebSocket connected.");
  
      // 1) Subscribe to layout updates using the layoutId.
      ws.send(
        JSON.stringify({
          type: "subscribe",
          layoutId, // now sending the layoutId to the server
        })
      );
  
      // 2) Subscribe to heatmap updates for the provided adIds.
      ws.send(
        JSON.stringify({
          type: "subscribeHeatmap",
          adIds,
        })
      );
  
      // 3) Also subscribe to aggregator updates for the same adIds.
      ws.send(
        JSON.stringify({
          type: "subscribeAdAggregates",
          adIds,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // We'll handle heatmap vs. aggregator in a switch statement:
        switch (msg.type) {
          case "heatmapUpdate": {
            const { updatedAdIds, points, dwellTime } = msg.data || {};
            console.log(
              "[LayoutList] Received partial heatmap update for:",
              updatedAdIds,
            );
            if (Array.isArray(points) && points.length > 0) {
              setHeatmapData((prev) => [...prev, ...points]);
            }
            if (dwellTime) {
              console.log("Latest dwellTime:", dwellTime);
            }
            break;
          }

          case "aggregatesUpdate": {
            const { adId, totalSessions, totalDwellTime, totalGazeSamples } =
              msg.data;
            setAggregateData((prevAggs) => {
              let found = false;
              const updated = prevAggs.map((agg) => {
                if (agg.adId === adId) {
                  found = true;
                  return {
                    ...agg,
                    totalSessions,
                    totalDwellTime,
                    totalGazeSamples,
                  };
                }
                return agg;
              });
              // If we never found that adId, insert a new entry
              if (!found) {
                updated.push({
                  adId,
                  totalSessions,
                  totalDwellTime,
                  totalGazeSamples,
                });
              }
              return updated;
            });
            break;
          }

          default:
            console.warn("[LayoutList] Unhandled WS message type:", msg.type);
        }
      } catch (err) {
        console.error("[LayoutList] Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      console.warn("[LayoutList] Heatmap WebSocket closed.");
      websocketRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("[LayoutList] Heatmap WebSocket error:", err);
    };
  };

  //---------------------------------------
  // 8) Layout Dimensions Handling
  //---------------------------------------
  useEffect(() => {
    const updateDimensions = () => {
      if (layoutContainerRef.current) {
        const { width, height } =
          layoutContainerRef.current.getBoundingClientRect();
        setLayoutDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, [selectedLayout]);

  //---------------------------------------
  // 9) Bounding Box Logic
  //---------------------------------------
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
    console.log("Boxes:", boxes);
    setAdBoundingBoxes(boxes);
  }, []);

  useEffect(() => {
    if (selectedLayout) {
      updateAdBoundingBoxes();
      window.addEventListener("resize", updateAdBoundingBoxes);
    }
    return () => {
      window.removeEventListener("resize", updateAdBoundingBoxes);
    };
  }, [updateAdBoundingBoxes, selectedLayout]);

  const toggleBorders = () => {
    setShowBorders((prev) => {
      const newVal = !prev;
      // Optionally, update bounding boxes when toggling
      if (newVal) {
        updateAdBoundingBoxes();
      }
      return newVal;
    });
  };

  //---------------------------------------
  // 10) Ad Session Handling (Enter/Exit)
  //---------------------------------------
  const startAdSession = useCallback((adId) => {
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

    // Collect gaze samples every 200ms
    gazeSamplingIntervalRef.current = setInterval(() => {
      if (!activeAdSessionRef.current) return;
      const { x, y } = lastGazeRef.current;
      const t = Date.now();
      activeAdSessionRef.current.gazeSamples.push({ x, y, timestamp: t });
    }, 200);
  }, []);

  const endAdSession = useCallback(() => {
    if (!activeAdSessionRef.current) return;
    const now = Date.now();
    const session = activeAdSessionRef.current;
    session.exitTime = now;
    session.dwellTime = session.exitTime - session.enterTime;

    if (gazeSamplingIntervalRef.current) {
      clearInterval(gazeSamplingIntervalRef.current);
      gazeSamplingIntervalRef.current = null;
    }

    sendAdSessionToServer(session);
    activeAdSessionRef.current = null;
  }, []);

  const sendAdSessionToServer = (session) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      const payload = {
        type: "adSessionComplete",
        data: {
          ...session,
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

  //---------------------------------------
  // 11) Gaze Event Handling
  //---------------------------------------
  const handleGazeAtAd = useCallback(
    ({ x, y }) => {
      // Store last gaze
      lastGazeRef.current = { x, y };

      let foundAdId = null;
      const adElements = document.querySelectorAll(".ad-item");
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

      const currentSession = activeAdSessionRef.current;
      const currentAdId = currentSession?.adId || null;

      // Switch session if the user gazes on a different ad
      if (foundAdId !== currentAdId) {
        if (currentSession) {
          endAdSession();
        }
        if (foundAdId) {
          startAdSession(foundAdId);
        }
      }

      // Simple "retention time" approach
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
    [gazedAdId, endAdSession, startAdSession],
  );

  //---------------------------------------
  // 12) Calibration / Tracking Handlers
  //---------------------------------------
  const handleStartCalibration = () => {
    if (!isModelReady) {
      alert("Eye Tracking model is still loading, please wait...");
      return;
    }
    if (isTracking) handleEndTracking();
    setIsCalibrating(true);
    setCalibrationCompleted(false);
    console.log("Calibration started");

    // **Show WebGazer's red dot during calibration**
    WebGazerSingleton.showPredictionPoints(true);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setCalibrationCompleted(true);

    // Save calibration data
    WebGazerSingleton.saveCalibrationDataToCookie();
    console.log("[LayoutList] Calibration completed and data saved to cookie");

    // **Hide WebGazer's red dot after calibration**
    WebGazerSingleton.showPredictionPoints(false);

    // Optionally, start tracking immediately
    setIsTracking(true);
  };

  const handleRecalibrate = () => {
    WebGazerSingleton.resetCalibrationData();
    setCalibrationCompleted(false);
    setIsCalibrating(true);
    console.log("Recalibration started");
  };

  //---------------------------------------
  // 13) Start / Resume / End Eye Tracking
  //---------------------------------------
  const handleStartTracking = async () => {
    console.log("[LayoutList] Start Eye Tracking clicked.");
    if (!isModelReady) {
      alert("Model still loading, please wait...");
      return;
    }
    try {
      await WebGazerSingleton.initialize((data) => {
        if (data) handleGazeAtAd(data);
      });
      setIsTracking(true);
      WebGazerSingleton.setCameraVisibility(showCamera);

      // **Ensure red dot is hidden when tracking starts**
      WebGazerSingleton.showPredictionPoints(false);
    } catch (err) {
      console.error("Failed to start tracking:", err);
    }
  };

  const handleResumeTracking = async () => {
    if (!isModelReady) {
      alert("Model still loading...");
      return;
    }
    if (!calibrationCompleted) {
      alert("You must calibrate first.");
      return;
    }

    try {
      await WebGazerSingleton.initialize((data) => {
        if (data) handleGazeAtAd(data);
      });
      setIsTracking(true);
      console.log("[LayoutList] Eye Tracking resumed.");
      WebGazerSingleton.setCameraVisibility(showCamera);

      // **Ensure red dot is hidden when tracking resumes**
      WebGazerSingleton.showPredictionPoints(false);
    } catch (err) {
      console.error("Failed to resume tracking:", err);
    }
  };

  const handleEndTracking = () => {
    if (activeAdSessionRef.current) {
      endAdSession();
    }
    WebGazerSingleton.end();
    setIsTracking(false);

    setRetentionTime(0);
    setIsLookingAtAd(false);
    setGazedAdId(null);
    setCurrentGazeData(null);
    console.log("WebGazer tracking ended.");

    // **Ensure red dot is hidden when tracking ends**
    WebGazerSingleton.showPredictionPoints(false);
  };

  //---------------------------------------
  // 14) UI Toggles
  //---------------------------------------
  const handleToggleCamera = () => {
    const newVal = !showCamera;
    setShowCamera(newVal);
    if (isTracking && WebGazerSingleton.instance) {
      WebGazerSingleton.setCameraVisibility(newVal);
      console.log(`Camera visibility set to ${newVal}`);
    }
  };

  const handleToggleVisualizer = () => {
    setShowVisualizer((prev) => !prev);
    console.log(`Gaze visualizer toggled to ${!showVisualizer}`);
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await previewRef.current.requestFullscreen();
        setIsFullscreen(true);
        console.log("Entered fullscreen mode");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        console.log("Exited fullscreen mode");
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  //---------------------------------------
  // 15) Layouts Display Logic
  //---------------------------------------
  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;
  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  //---------------------------------------
  // 16) Webgazer and Analytics Controls (ys here dont flame me)
  //---------------------------------------
  const controlGroups = [
    {
      title: "Calibration",
      controls: [
        {
          show: !isCalibrating && !calibrationCompleted,
          component: (
            <button
              onClick={handleStartCalibration}
              className="flex w-full items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-white transition hover:bg-blue-600 disabled:opacity-50"
              disabled={isCalibrating || isTracking || !selectedLayout}
            >
              <Eye className="h-4 w-4" />
              Start Calibration
            </button>
          ),
        },
        {
          show: true,
          component: (
            <button
              onClick={handleRecalibrate}
              className="flex w-full items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-white transition hover:bg-yellow-600 disabled:opacity-50"
              disabled={!selectedLayout}
            >
              <RefreshCw className="h-4 w-4" />
              Recalibrate
            </button>
          ),
        },
      ],
    },
    {
      title: "Tracking",
      controls: [
        {
          show: !isTracking,
          component: (
            <button
              onClick={handleStartTracking}
              className="flex w-full items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-white transition hover:bg-blue-600 disabled:opacity-50"
              disabled={
                !isModelReady ||
                !(
                  WebGazerSingleton.hasSavedCalibration() ||
                  calibrationCompleted
                )
              }
            >
              <PlayCircle className="h-4 w-4" />
              Start Eye Tracking
            </button>
          ),
        },
        {
          show: isTracking,
          component: (
            <button
              onClick={handleEndTracking}
              className="flex w-full items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-white transition hover:bg-red-600"
            >
              <StopCircle className="h-4 w-4" />
              End Tracking
            </button>
          ),
        },
        {
          show: !isTracking && calibrationCompleted,
          component: (
            <button
              onClick={handleResumeTracking}
              className="flex w-full items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-white transition hover:bg-blue-600 disabled:opacity-50"
              disabled={!selectedLayout}
            >
              <PlayCircle className="h-4 w-4" />
              Resume Eye Tracking
            </button>
          ),
        },
      ],
    },
    {
      title: "Visualization",
      controls: [
        {
          show: true,
          component: (
            <button
              onClick={toggleBorders}
              className="flex w-full items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-white transition hover:bg-gray-600"
            >
              <Grid className="h-4 w-4" />
              {showBorders ? "Hide Borders" : "Show Borders"}
            </button>
          ),
        },
        {
          show: true,
          component: (
            <button
              onClick={handleToggleCamera}
              className="flex w-full items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-white transition hover:bg-gray-600"
            >
              <Camera className="h-4 w-4" />
              {showCamera ? "Hide Camera" : "Show Camera"}
            </button>
          ),
        },
        {
          show: true,
          component: (
            <button
              onClick={handleToggleVisualizer}
              className="flex w-full items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-white transition hover:bg-gray-600"
            >
              <Eye className="h-4 w-4" />
              {showVisualizer ? "Hide Gaze Dot" : "Show Gaze Dot"}
            </button>
          ),
        },
        {
          show: true,
          component: (
            <button
              onClick={() => setShowHeatmap((prev) => !prev)}
              className="flex w-full items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-white transition hover:bg-green-600"
            >
              <Activity className="h-4 w-4" />
              {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen dark:dark-bg">
      {/* Panel Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed bottom-0 left-1/2 z-50 -translate-x-1/2 rounded-t-lg bg-gray-800 px-4 py-2 text-white shadow-lg transition-transform hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Controls
          {isPanelOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Bottom Controls Panel */}
      <div
        className={`fixed bottom-0 left-0 z-40 w-full transform bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
          isPanelOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-7xl p-4">
          <div className="grid grid-cols-3 gap-8">
            {controlGroups.map((group, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-semibold text-gray-500 dark:text-gray-400">
                  {group.title}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.controls.map((control, controlIndex) => (
                    <div key={controlIndex}>
                      {control.show && control.component}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Navbar />

      <div className="container mx-auto w-full p-4 md:p-12">
        {/* Layout Selection + Preview */}
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          {/* Sidebar: Available Layouts */}
          <div className="w-full md:w-[300px] md:flex-shrink-0">
            <div className="mb-6 rounded-lg p-6 shadow light-bg dark:dark-bg dark:secondary-text md:mb-0">
              <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
              {loading && !selectedLayout && (
                <div className="flex items-center justify-center p-4 neutral-text">
                  {/* Loading Indicator */}
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
          <div className="relative flex-1 md:ml-8" ref={layoutContainerRef}>
            <div
              className="relative flex h-[500px] items-center justify-center rounded-lg border-8 p-4 secondary-border md:h-full md:min-h-[600px]"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Fullscreen Toggle Button - Visible on Hover */}
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
                className={`h-full w-full overflow-hidden rounded-lg bg-white ${
                  isFullscreen ? "flex items-center justify-center" : ""
                }`}
              >
                {/* Render the layout or "Loading..." */}
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

                {/* Heatmap Overlay */}
                {selectedLayout &&
                  showHeatmap &&
                  heatmapData.length > 0 &&
                  layoutDimensions.width > 0 &&
                  layoutDimensions.height > 0 && (
                    <ErrorBoundary>
                      <HeatmapOverlay
                        heatmapData={heatmapData}
                        layoutDimensions={layoutDimensions}
                      />
                    </ErrorBoundary>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Viewer Analytics & Aggregates ===== */}
        {selectedLayout && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow primary-text dark:bg-gray-800 dark:secondary-text">
            <h2 className="mb-4 text-xl font-bold">Viewer Analytics</h2>

            {!calibrationCompleted &&
            !WebGazerSingleton.hasSavedCalibration() ? (
              <div className="rounded-lg bg-blue-100 p-4 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                Complete Calibration to view user analytics
              </div>
            ) : (
              <>
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

                {/* Show aggregator info for all ads */}
                {aggregateData?.length > 0 && (
                  <div className="mt-6 rounded-md bg-gray-100 p-4 dark:bg-gray-700">
                    <h3 className="mb-2 text-lg font-semibold">
                      Ad Aggregates
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {aggregateData.map((agg) => (
                        <div
                          key={agg.adId}
                          className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800"
                        >
                          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-300">
                            Ad ID
                          </p>
                          <p className="break-all text-base font-bold text-gray-800 dark:text-gray-100">
                            {agg.adId}
                          </p>

                          <hr className="my-2 border-gray-200 dark:border-gray-600" />

                          <div className="flex flex-col space-y-1">
                            <div>
                              <span className="text-sm text-gray-500 dark:text-gray-300">
                                Total Sessions:
                              </span>
                              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-100">
                                {agg.totalSessions}
                              </span>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500 dark:text-gray-300">
                                Total Dwell Time:
                              </span>
                              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-100">
                                {agg.totalDwellTime}
                              </span>
                            </div>

                            <div>
                              <span className="text-sm text-gray-500 dark:text-gray-300">
                                Total Gaze Samples:
                              </span>
                              <span className="ml-1 font-semibold text-gray-800 dark:text-gray-100">
                                {agg.totalGazeSamples}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== Calibration Overlay ===== */}
      {isCalibrating && (
        <CalibrationComponent
          onCalibrationComplete={handleCalibrationComplete}
        />
      )}

      {/* ===== Gaze Tracking ===== */}
      {isTracking && selectedLayout && (
        <GazeTrackingComponent onGaze={handleGazeAtAd} isActive={isTracking} />
      )}

      {/* ===== Gaze Visualizer ===== */}
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
