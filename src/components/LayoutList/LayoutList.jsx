<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";

=======
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Navbar";
import { Maximize2, Minimize2 } from "lucide-react";
import LayoutViewer from "../AdViewer/LayoutViewer";
import axios from "axios";
// LayoutList is a component that displays a list of available layouts, nested within is the LayoutViewer component, which renders the layout of ads
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
<<<<<<< HEAD

  useEffect(() => {
    fetchLayouts();
  }, []);

=======
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovering] = useState(false);
  const previewRef = useRef(null);

  const MOBILE_DISPLAY_LIMIT = 3;
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null); // Helps debounce clicks and avoid multiple unnecessary WebSocket creations.
  const reconnectAttemptsRef = useRef(0); // Keeps track of reconnection attempts.

  useEffect(() => {
    fetchLayouts();
    // Handle window resize and fullscreen change events
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();

    // Handle fullscreen change event
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    // Add event listeners
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      // Cleanup WebSocket when component unmounts
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Function to toggle fullscreen mode
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

  // Function to fetch layouts
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  const fetchLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
<<<<<<< HEAD
      const response = await fetch("http://localhost:5000/api/layouts");
      if (!response.ok) {
        throw new Error("Failed to fetch layouts");
      }
      const data = await response.json();
      const uniqueLayouts = data.filter(
        (layout, index, self) =>
          index === self.findIndex((l) => l.layoutId === layout.layoutId),
      );
      setLayouts(uniqueLayouts);
=======

      // Using axios to fetch layouts
      const response = await axios.get("http://localhost:5000/api/layouts");

      // The data is already parsed as JSON, so you can use it directly
      setLayouts(response.data);
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const fetchLayoutDetails = async (layoutId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `http://localhost:5000/api/layouts/${layoutId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch layout details");
      }
      const data = await response.json();
      setSelectedLayout(data);
=======
  // Function to handle layout selection
  const handleLayoutSelect = async (layoutId) => {
    if (pendingLayoutIdRef.current === layoutId) {
      // If this layout is already pending, ignore the repeated request.
      return;
    }
    pendingLayoutIdRef.current = layoutId;
    reconnectAttemptsRef.current = 0; // Reset reconnect attempts for new selection

    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null);

      // Close the previous WebSocket connection if one exists
      if (websocketRef.current) {
        websocketRef.current.onclose = null; // Remove any existing onclose handlers to avoid triggering reconnections
        websocketRef.current.close();
        websocketRef.current = null;
      }

      // Fetch the initial layout data using axios
      const response = await axios.get(
        `http://localhost:5000/api/layouts/${layoutId}`,
      );
      const layoutData = response.data; // axios automatically parses JSON

      // Extract unique adIds from scheduledAds
      const adIdsSet = new Set();
      layoutData.gridItems.forEach((item) => {
        item.scheduledAds.forEach((scheduledAd) => {
          if (scheduledAd.adId) {
            adIdsSet.add(scheduledAd.adId);
          }
        });
      });
      const adIds = Array.from(adIdsSet);

      // Fetch ad details
      const adsResponse = await axios.post(
        `http://localhost:5000/api/ads/batchGet`,
        { adIds },
      );
      const ads = adsResponse.data;

      // Map adId to ad details
      const adsMap = {};
      ads.forEach((ad) => {
        adsMap[ad.adId] = ad;
      });

      // Attach ad details to scheduledAds
      layoutData.gridItems = layoutData.gridItems.map((item) => {
        const updatedScheduledAds = item.scheduledAds.map((scheduledAd) => ({
          ...scheduledAd,
          ad: adsMap[scheduledAd.adId] || null,
        }));
        return { ...item, scheduledAds: updatedScheduledAds };
      });

      setSelectedLayout(layoutData);

      // Set up WebSocket connection for real-time updates
      establishWebSocketConnection(layoutId);
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
    } catch (err) {
      setError(err.response?.data?.message || err.message); // Detailed error message if available
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const AdComponent = ({ type, content, styles }) => {
    let mediaUrl = content.mediaUrl || content.src;

    if (!mediaUrl && content.s3Bucket && content.s3Key) {
      const s3Region = content.s3Region || "ap-southeast-1";
      const encodeS3Key = (key) => {
        return key
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/");
      };
      const encodedS3Key = encodeS3Key(content.s3Key);
      mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
    }

    return (
      <div
        className="h-full overflow-hidden rounded-lg shadow-sm"
        style={styles}
      >
        {type === "text" && (
          <div className="p-4">
            <h3 className="text-lg font-semibold">{content.title}</h3>
            <p className="text-gray-600">{content.description}</p>
          </div>
        )}
        {type === "image" && (
          <div>
            <img
              src={mediaUrl}
              alt={content.title}
              className="h-auto w-full object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{content.title}</h3>
              <p className="text-gray-600">{content.description}</p>
            </div>
          </div>
        )}
        {type === "video" && (
          <div>
            <video controls className="w-full">
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{content.title}</h3>
              <p className="text-gray-600">{content.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdViewer = ({ layout }) => {
    if (!layout) {
      return <div>No layout provided</div>;
    }

    const { rows, columns, gridItems } = layout;

    return (
      <div
        className="grid h-full w-full gap-4"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {gridItems.map((item) => {
          if (!item || item.hidden) return null;

          const { index, row, column, scheduledAds, rowSpan, colSpan } = item;

          let adToDisplay = null;

          if (scheduledAds?.length > 0) {
            const now = new Date();
            const currentTimeString = `${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;

            const availableAds = scheduledAds.filter(
              (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString,
            );

            if (availableAds.length > 0) {
              adToDisplay = availableAds.reduce((latestAd, currentAd) =>
                currentAd.scheduledTime > latestAd.scheduledTime
                  ? currentAd
                  : latestAd,
              );
            } else {
              adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
                currentAd.scheduledTime < nextAd.scheduledTime
                  ? currentAd
                  : nextAd,
              );
            }
          }

          if (!adToDisplay) return null;

          const ad = adToDisplay.ad;
          const { type, content, styles } = ad;

          const gridRowStart = row + 1;
          const gridColumnStart = column + 1;
          const gridRowEnd = gridRowStart + (rowSpan || 1);
          const gridColumnEnd = gridColumnStart + (colSpan || 1);

          return (
            <div
              key={index}
              className="rounded-lg bg-white"
              style={{
                gridRow: `${gridRowStart} / ${gridRowEnd}`,
                gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
              }}
            >
              <AdComponent type={type} content={content} styles={styles} />
            </div>
          );
        })}
      </div>
    );
  };
=======
  // Function to establish WebSocket connection
  const establishWebSocketConnection = (layoutId) => {
    websocketRef.current = new WebSocket("ws://localhost:5000");

    websocketRef.current.onopen = () => {
      websocketRef.current.send(
        JSON.stringify({ type: "subscribe", layoutId }),
      );
    };
    // Handle incoming WebSocket messages
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
        console.error("[FRONTEND] Error parsing WebSocket message:", e);
      }
    };
    // Handle WebSocket close event
    websocketRef.current.onclose = (event) => {
      if (
        pendingLayoutIdRef.current === layoutId &&
        reconnectAttemptsRef.current < 5
      ) {
        reconnectAttemptsRef.current += 1;
        setTimeout(() => {
          establishWebSocketConnection(layoutId);
        }, 5000);
      }
    };
    // Handle WebSocket errors
    websocketRef.current.onerror = (error) => {
      console.error("[FRONTEND] WebSocket error:", error);
    };
  };
  // Display only the first 3 layouts on mobile
  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;
  // Check if there are more layouts to display
  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
<<<<<<< HEAD
    <>
      <Navbar />
      <div className="container p-4">
        <div className="grid md:flex md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow md:w-[20vw]">
            <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
            {loading && !selectedLayout && (
              <div className="flex items-center justify-center p-4 text-gray-600">
                <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
                  onClick={() => fetchLayoutDetails(layout.layoutId)}
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
=======
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen dark:dark-bg"
    >
      <Navbar />
      <div className="container mx-auto w-full p-4 md:p-12">
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          <motion.div
            variants={fadeVariants}
            className="w-full md:w-[300px] md:flex-shrink-0"
          >
            <div className="mb-6 rounded-lg p-6 shadow light-bg dark:dark-bg dark:secondary-text md:mb-0">
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
                  className="flex items-center justify-center p-4 neutral-text"
                >
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
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
<<<<<<< HEAD
                  Loading layout preview...
                </div>
              )}
              {selectedLayout && !loading && (
                <AdViewer layout={selectedLayout} />
              )}
              {!selectedLayout && !loading && (
                <div className="p-4 text-center text-gray-500">
                  Select a layout to preview
                </div>
              )}
=======
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
                        ? "secondary-bg secondary-text"
                        : "neutral-bg primary-text hover:neutralalt-bg"
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
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors neutral-bg neutral-text hover:neutral-bg"
                    onClick={() => setShowAllLayouts(!showAllLayouts)}
                  >
                    <span>{showAllLayouts ? "Show Less" : "Show More"}</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={fadeVariants} className="flex-1 md:ml-8">
            <div className="relative flex h-[500px] flex-col rounded-xl bg-gray-800 p-4 md:h-full md:min-h-[600px]">
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-lg dark-bg">
                <AnimatePresence>
                  {selectedLayout && !loading && (
                    <motion.button
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: isHovering || isFullscreen ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      onClick={toggleFullscreen}
                      className="absolute right-6 top-6 z-10 rounded-full bg-gray-800/80 p-2 transition-opacity duration-200 secondary-text hover:bg-gray-700/80"
                      aria-label={
                        isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                      }
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-5 w-5" />
                      ) : (
                        <Maximize2 className="h-5 w-5" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                <div
                  ref={previewRef}
                  className="flex h-full w-full items-center justify-center bg-white"
                >
                  <AnimatePresence mode="wait">
                    {loading && selectedLayout && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center p-4 light-text"
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
                        className="h-full w-full overflow-hidden"
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
                        className="flex h-full items-center justify-center p-4 neutral-text"
                      >
                        Select a layout to preview
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
            </div>
          </motion.div>
        </div>
      </div>
<<<<<<< HEAD
    </>
=======
    </motion.div>
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  );
};

export default LayoutList;
