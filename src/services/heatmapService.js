import axios from "axios";

export const fetchSessionDataByAdIds = async (adIds) => {
  try {
    const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const response = await axios.post(
      `${baseURL}/api/adAnalytics/sessionDataByAdIds`,
      { adIds },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching session data by adIds:", error);
    throw error;
  }
};
