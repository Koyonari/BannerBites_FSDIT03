import React, { useEffect, useState } from "react";
import HeatMap from "react-heatmap-component";

const HeatmapOverlay = ({ layoutRef, adIds }) => {
  const [heatmapData, setHeatmapData] = useState([]); // Store heatmap data
  const [layoutDimensions, setLayoutDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const fetchInitialHeatmapData = async () => {
      try {
        console.log("[Frontend] Sending adIds to backend:", adIds);
        const response = await fetch(
          `http://localhost:5000/api/heatmap/sessionDataByAdIds`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ adIds }),
          }
        );
  
        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log("[Frontend] Received heatmap data:", data);
  
        if (!data || !data.sessions) {
          throw new Error("Invalid heatmap data format received.");
        }
  
        const heatmapPoints = data.sessions.flatMap((session) =>
          (session.gazeSamples || []).map((sample) => ({
            x: sample.x || 0,
            y: sample.y || 0,
            value: sample.value || 1,
          }))
        );
  
        setHeatmapData(heatmapPoints);
      } catch (error) {
        console.error("[Frontend] Error fetching initial heatmap data:", error);
        setHeatmapData([]); // Fallback to empty data
      }
    };
  
    if (adIds?.length > 0) {
      fetchInitialHeatmapData();
    } else {
      console.warn("[Frontend] No adIds provided; skipping fetch.");
    }
  }, [adIds]);
  
  useEffect(() => {
    if (!layoutRef.current) return;

    const layoutElement = layoutRef.current;
    const { width, height } = layoutElement.getBoundingClientRect();
    setLayoutDimensions({ width, height });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setLayoutDimensions({ width, height });
      }
    });

    resizeObserver.observe(layoutElement);

    return () => resizeObserver.disconnect();
  }, [layoutRef]);

  return (
    <HeatMap
      points={Array.isArray(heatmapData) ? heatmapData : []} // Ensure array
      width={layoutDimensions.width}
      height={layoutDimensions.height}
      radius={50}
      maxIntensity={5}
      gradient={{
        0.45: "blue",
        0.55: "lime",
        0.65: "yellow",
        0.95: "red",
      }}
      opacity={0.6}
      className="absolute top-0 left-0"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default HeatmapOverlay;
