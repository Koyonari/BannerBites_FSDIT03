import React, { useEffect, useState } from "react";
import Heatmap from "./Heatmap"; // Ensure correct import path
import PropTypes from "prop-types";
import { fetchSessionDataByAdIds } from "../../services/heatmapService";
import ErrorBoundary from "../ErrorBoundary"; // Optional: For better error handling

const HeatmapOverlay = ({ layoutRef, adIds }) => {
  const [heatmapData, setHeatmapData] = useState([]); // Heatmap points
  const [layoutDimensions, setLayoutDimensions] = useState({ width: 0, height: 0 });
  const [hasError, setHasError] = useState(false); // Error state
  const [errorMessage, setErrorMessage] = useState(""); // Enhanced error message

  // Measure layout dimensions using ResizeObserver
  useEffect(() => {
    if (!layoutRef.current) {
      console.warn("[HeatmapOverlay] layoutRef is not defined.");
      return;
    }

    const layoutElement = layoutRef.current;
    const { width, height } = layoutElement.getBoundingClientRect();

    // Only update if dimensions have changed
    setLayoutDimensions((prevDimensions) => {
      if (prevDimensions.width !== width || prevDimensions.height !== height) {
        return { width, height };
      }
      return prevDimensions;
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setLayoutDimensions((prevDimensions) => {
          if (prevDimensions.width !== width || prevDimensions.height !== height) {
            return { width, height };
          }
          return prevDimensions;
        });
        console.log("Layout Resized:", { width, height });
      }
    });

    resizeObserver.observe(layoutElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [layoutRef]);

  // Fetch and process heatmap data only when adIds and layoutDimensions are set
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        console.log("Fetching heatmap data for adIds:", adIds);
        const data = await fetchSessionDataByAdIds(adIds);

        if (!data || !data.sessions || !Array.isArray(data.sessions.items)) {
          console.warn("[HeatmapOverlay] No valid sessions received from API.");
          setHeatmapData([]);
          return;
        }

        const sessions = data.sessions.items;

        if (sessions.length === 0) {
          console.warn("[HeatmapOverlay] No sessions found for the provided adIds.");
          setHeatmapData([]);
          return;
        }

        // Process gazeSamples to extract heatmap points
        const points = sessions.flatMap((session) => {
          let gazeSamples = [];
          try {
            gazeSamples = JSON.parse(session.gazeSamples);
            if (!Array.isArray(gazeSamples)) {
              console.warn(`[HeatmapOverlay] gazeSamples for session ${session.sessionId} is not an array.`);
              gazeSamples = [];
            }
          } catch (error) {
            console.error(`[HeatmapOverlay] Error parsing gazeSamples for session ${session.sessionId}:`, error);
            gazeSamples = [];
          }

          return gazeSamples.map((sample) => {
            const layoutRect = layoutRef.current.getBoundingClientRect();
          
            // Assuming sample.x and sample.y are relative to the viewport
            const relativeX = sample.x - layoutRect.left;
            const relativeY = sample.y - layoutRect.top;
          
            // Normalize coordinates based on layout dimensions
            const normalizedX = relativeX / layoutDimensions.width;
            const normalizedY = relativeY / layoutDimensions.height;
          
            return {
              x: normalizedX * layoutDimensions.width,
              y: normalizedY * layoutDimensions.height,
              value: sample.value || 1,
            };
          });
        });

        setHeatmapData(points);
        console.log("[Frontend][Heatmap] Heatmap points:", points);
      } catch (error) {
        if (error.response) {
          // Handle specific status codes
          switch (error.response.status) {
            case 404:
              setErrorMessage("Heatmap data endpoint not found.");
              break;
            case 500:
              setErrorMessage("Internal server error while fetching heatmap data.");
              break;
            default:
              setErrorMessage("An error occurred while fetching heatmap data.");
          }
          setHasError(true);
        } else if (error.request) {
          setErrorMessage("No response from server. Please check your network connection.");
          setHasError(true);
        } else {
          setErrorMessage("An unexpected error occurred.");
          setHasError(true);
        }
        console.error("[HeatmapOverlay] Error fetching heatmap data:", error);
      }
    };

    // Only fetch data if adIds are present and layoutDimensions are set
    if (adIds.length > 0 && layoutDimensions.width > 0 && layoutDimensions.height > 0) {
      fetchHeatmapData();
    } else {
      console.warn("[HeatmapOverlay] Insufficient data to fetch heatmap.");
      setHeatmapData([]); // Clear heatmap data if conditions are not met
    }
  }, [adIds, layoutDimensions, layoutRef]);

  // Conditional rendering to prevent Heatmap from receiving invalid data
  if (hasError) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-transparent">
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  if (heatmapData.length === 0 || layoutDimensions.width === 0 || layoutDimensions.height === 0) {
    return null; // Optionally render a placeholder or nothing
  }

  return (
    <ErrorBoundary>
      <Heatmap
        data={heatmapData} // Ensure it's an array of {x, y, value}
        width={layoutDimensions.width}
        height={layoutDimensions.height}
        title="User Gaze Heatmap" // Optional: Customize title
      />
    </ErrorBoundary>
  );
};

HeatmapOverlay.propTypes = {
  layoutRef: PropTypes.object.isRequired,
  adIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default HeatmapOverlay;
