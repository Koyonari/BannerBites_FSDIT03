import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar";
import LayoutViewer from "../AdViewer/LayoutViewer"; // Import LayoutViewer here

const LayoutList = () => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const eventSourceRef = useRef(null); // Use useRef to keep track of the SSE connection

  useEffect(() => {
    fetchLayouts();
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
      const uniqueLayouts = data.filter(
        (layout, index, self) =>
          index === self.findIndex((l) => l.layoutId === layout.layoutId)
      );
      setLayouts(uniqueLayouts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutSelect = async (layoutId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedLayout(null); // Reset selected layout while fetching

      if (eventSourceRef.current) {
        // Clean up any existing SSE connection
        console.log(`[LayoutList] Cleaning up existing SSE connection for layoutId: ${selectedLayout?.layoutId}`);
        eventSourceRef.current.close();
      }

      // Fetch the initial layout data
      const response = await fetch(`http://localhost:5000/api/layouts/${layoutId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch layout details for layoutId: ${layoutId}`);
      }

      const data = await response.json();
      console.log("[LayoutList] Fetched layout data:", data);

      setSelectedLayout(data);
      setupSSE(layoutId); // Set up SSE for the selected layout
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = (layoutId) => {
    console.log(`[LayoutList] Setting up SSE for layoutId: ${layoutId}`);

    try {
      eventSourceRef.current = new EventSource(`http://localhost:5000/events?layoutId=${layoutId}`);

      eventSourceRef.current.onopen = () => {
        console.log("[FRONTEND] Connected to SSE server for layout:", layoutId);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log("[FRONTEND] Received SSE message:", parsedData);

          if (
            (parsedData.type === "layoutUpdate" || parsedData.type === "layoutData") &&
            parsedData.data.layoutId === layoutId
          ) {
            setSelectedLayout(parsedData.data); // Update the layout state with new data
            console.log("[FRONTEND] Layout updated via SSE:", parsedData.data);
          }
        } catch (e) {
          console.error("[FRONTEND] Error parsing SSE message:", e);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error("[FRONTEND] SSE error:", error);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Attempt to reconnect after a delay
        setTimeout(() => {
          console.log("[FRONTEND] Reconnecting to SSE...");
          setupSSE(layoutId);
        }, 5000); // 5-second delay before attempting to reconnect
      };
    } catch (err) {
      console.error("[FRONTEND] Failed to initialize SSE connection:", err);
    }
  };

  return (
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
                <div className="p-4 text-center text-gray-500">
                  Select a layout to preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LayoutList;
