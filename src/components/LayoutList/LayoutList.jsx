import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar";
import { Maximize2, Minimize2 } from "lucide-react";
import LayoutViewer from "../AdViewer/LayoutViewer";

const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllLayouts, setShowAllLayouts] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const previewRef = useRef(null);

  const MOBILE_DISPLAY_LIMIT = 3;
  const websocketRef = useRef(null);
  const pendingLayoutIdRef = useRef(null); // Helps debounce clicks and avoid multiple unnecessary WebSocket creations.
  const reconnectAttemptsRef = useRef(0); // Keeps track of reconnection attempts.

  useEffect(() => {
    fetchLayouts();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      // Cleanup WebSocket when component unmounts
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

      // Fetch the initial layout data
      const response = await fetch(
        `http://localhost:5000/api/layouts/${layoutId}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch layout details for layoutId: ${layoutId}`
        );
      }
      const data = await response.json();
      setSelectedLayout(data);

      // Set up WebSocket connection for real-time updates
      establishWebSocketConnection(layoutId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      pendingLayoutIdRef.current = null; // Allow new layout selection after handling is complete
    }
  };

  const establishWebSocketConnection = (layoutId) => {
    websocketRef.current = new WebSocket("ws://localhost:5000");

    websocketRef.current.onopen = () => {
      websocketRef.current.send(JSON.stringify({ type: "subscribe", layoutId }));
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
        console.error("[FRONTEND] Error parsing WebSocket message:", e);
      }
    };

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

    websocketRef.current.onerror = (error) => {
      console.error("[FRONTEND] WebSocket error:", error);
    };
  };

  const visibleLayouts =
    isMobile && !showAllLayouts
      ? layouts.slice(0, MOBILE_DISPLAY_LIMIT)
      : layouts;

  const hasMoreLayouts = isMobile && layouts.length > MOBILE_DISPLAY_LIMIT;

  return (
    <div className="min-h-screen dark:bg-black">
      <Navbar />
      <div className="container mx-auto w-full p-4 md:p-12">
        <div className="flex flex-col md:min-h-[600px] md:flex-row">
          <div className="w-full md:w-[300px] md:flex-shrink-0">
            <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-black dark:text-white md:mb-0">
              <h2 className="mb-4 text-xl font-bold">Available Layouts</h2>
              {loading && !selectedLayout && (
                <div className="flex items-center justify-center p-4 text-gray-600">
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
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
                  Error: {error}
                </div>
              )}
              <div className="space-y-2">
                {visibleLayouts.map((layout) => (
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
                {hasMoreLayouts && (
                  <button
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                    onClick={() => setShowAllLayouts(!showAllLayouts)}
                  >
                    <span>{showAllLayouts ? "Show Less" : `Show More`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 md:ml-8">
            <div
              className="relative flex h-[500px] items-center justify-center rounded-lg border-8 border-gray-800 bg-black p-4 shadow-lg md:h-full md:min-h-[600px]"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {selectedLayout && !loading && (
                <button
                  onClick={toggleFullscreen}
                  className={`absolute right-6 top-6 z-10 rounded-full bg-gray-800 p-2 text-white transition-opacity duration-200 hover:bg-gray-700 ${
                    isHovering || isFullscreen ? "opacity-100" : "opacity-0"
                  }`}
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
                className={`h-full w-full overflow-hidden rounded-lg bg-white shadow-inner ${
                  isFullscreen ? "flex items-center justify-center" : ""
                }`}
              >
                {loading && selectedLayout && (
                  <div className="flex h-full items-center justify-center p-4 text-gray-600">
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
                  <div className="flex h-full items-center justify-center p-4 text-gray-500">
                    Select a layout to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutList;
