import axios from "axios";

export const fetchSessionDataByAdIds = async (adIds) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/heatmap/sessionDataByAdIds",
      { adIds },
      {
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching session data by adIds:", error);
    throw error;
  }
};
