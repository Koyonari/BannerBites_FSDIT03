// heatmapService.js

import axios from "axios";

/**
 * Fetches session data from the backend by adIds.
 * @param {Array<string>} adIds - Array of ad IDs.
 * @returns {Promise<Object>} - API response data.
 */
export const fetchSessionDataByAdIds = async (adIds) => {
  try {
    console.log("Sending POST request to /api/heatmap/sessionDataByAdIds with adIds:", adIds);
    const response = await axios.post(
      "http://localhost:5000/api/heatmap/sessionDataByAdIds", // Relative path; proxy handles the base URL
      { adIds },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Received response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching session data by adIds:", error);
    throw error;
  }
};
