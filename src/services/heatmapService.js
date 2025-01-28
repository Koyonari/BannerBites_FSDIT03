// src/services/heatmapService.js

import axios from "axios";

/**
 * Fetches session data from the backend.
 * @returns {Promise<Array>} - Array of session items.
 */
export const fetchSessionData = async () => {
  try {
    const response = await axios.get("/api/heatmap/sessionData");
    return response.data;
  } catch (error) {
    console.error("Error fetching session data:", error);
    return [];
  }
};

/**
 * Fetches aggregate data from the backend.
 * @returns {Promise<Array>} - Array of aggregate items.
 */
export const fetchAggregateData = async () => {
  try {
    const response = await axios.get("/api/heatmap/aggregateData");
    return response.data;
  } catch (error) {
    console.error("Error fetching aggregate data:", error);
    return [];
  }
};

/**
 * Processes session data to extract heatmap points.
 * @param {Array} sessionData - Array of session items.
 * @param {Object} layoutDimensions - Dimensions of the layout (width, height).
 * @returns {Array} - Array of heatmap points.
 */
export const processHeatmapData = (sessionData, layoutDimensions) => {
  const points = [];
  const processedPoints = new Set(); // To avoid duplicates
  sessionData.forEach((session) => {
    let gazeSamples = [];
    try {
      gazeSamples = JSON.parse(session.gazeSamples);
    } catch (error) {
      console.error(`Error parsing gazeSamples:`, error);
    }
    gazeSamples.forEach(({ x, y }) => {
      const px = Math.round(x * layoutDimensions.width);
      const py = Math.round(y * layoutDimensions.height);
      const pointKey = `${px}-${py}`;
      if (!processedPoints.has(pointKey)) {
        points.push({ x: px, y: py, value: 1 });
        processedPoints.add(pointKey);
      }
    });
  });
  return points;
};