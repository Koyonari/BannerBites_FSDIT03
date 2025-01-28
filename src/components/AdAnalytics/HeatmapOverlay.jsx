import React, { useEffect, useState } from "react";
import Heatmap from "./Heatmap";
import PropTypes from "prop-types";
import { fetchSessionDataByAdIds } from "../../services/heatmapService";

const HeatmapOverlay = ({ layoutRef, adIds }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [layoutDimensions, setLayoutDimensions] = useState({ width: 0, height: 0 });
  const [hasError, setHasError] = useState(false); // For error state
  const [errorMessage, setErrorMessage] = useState(""); // For detailed error messages

  // Set layout dimensions based on the layoutRef
  useEffect(() => {
    const layoutElement = layoutRef.current;
    if (layoutElement) {
      const updateDimensions = () => {
        const { width, height } = layoutElement.getBoundingClientRect();
        setLayoutDimensions({ width, height });
      };
  
      updateDimensions();
  
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(layoutElement);
  
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [layoutRef]);

  // Fetch heatmap data when adIds change
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        console.log("Fetching heatmap data for adIds:", adIds);
        const data = await fetchSessionDataByAdIds(adIds);

        if (!data || !data.sessions || !Array.isArray(data.sessions)) {
          console.warn("[HeatmapOverlay] No valid sessions received from API.");
          setHeatmapData([]);
          return;
        }

        const sessions = data.sessions;

        if (sessions.length === 0) {
          console.warn("[HeatmapOverlay] No sessions found for the provided adIds.");
          setHeatmapData([]);
          return;
        }

        // Process gazeSamples to extract heatmap points
        const points = sessions.flatMap((session) => {
          const gazeSamples = Array.isArray(session.gazeSamples) ? session.gazeSamples : [];

          return gazeSamples.map((sample) => {
            const layoutRect = layoutRef.current.getBoundingClientRect();

            // Adjust coordinates relative to the layout
            const relativeX = sample.x - layoutRect.left;
            const relativeY = sample.y - layoutRect.top;

            // Normalize and return heatmap point
            return {
              x: (relativeX / layoutDimensions.width) * layoutDimensions.width,
              y: (relativeY / layoutDimensions.height) * layoutDimensions.height,
              value: sample.value || 1,
            };
          });
        });

        setHeatmapData(points);
        console.log("[Frontend][Heatmap] Heatmap points:", points);
      } catch (error) {
        handleFetchError(error);
      }
    };

    if (adIds.length > 0 && layoutDimensions.width > 0 && layoutDimensions.height > 0) {
      fetchHeatmapData();
    }
  }, [adIds, layoutDimensions]);

  const handleFetchError = (error) => {
    if (error.response) {
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
    } else if (error.request) {
      setErrorMessage("No response from server. Please check your network connection.");
    } else {
      setErrorMessage("An unexpected error occurred.");
    }
    setHasError(true);
    console.error("[HeatmapOverlay] Error fetching heatmap data:", error);
  };

  if (hasError) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-transparent">
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  if (heatmapData.length === 0 || layoutDimensions.width === 0 || layoutDimensions.height === 0) {
    return null;
  }

  return (
    <Heatmap
      data={heatmapData}
      width={layoutDimensions.width}
      height={layoutDimensions.height}
      title="User Gaze Heatmap"
    />
  );
};

HeatmapOverlay.propTypes = {
  layoutRef: PropTypes.object.isRequired,
  adIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default HeatmapOverlay;
