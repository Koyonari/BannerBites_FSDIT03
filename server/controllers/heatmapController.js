const HeatmapModel = require("../models/HeatmapModel");

const HeatmapController = {
  // Fetch all session data
  getSessionData: async (req, res) => {
    try {
      const sessions = await HeatmapModel.getAllSessionData();
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessionData:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Fetch session data by a single adId (via URL param)
  getSessionDataByAdId: async (req, res) => {
    try {
      const { adId } = req.params; // Get adId from URL parameter
      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }

      const sessions = await HeatmapModel.getSessionDataByAdIds([adId]); // Pass as an array
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessionDataByAdId:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Fetch session data for multiple adIds (via request body)
  getSessionDataByAdIds: async (req, res) => {
    try {
      const { adIds } = req.body; // Get adIds from request body
      if (!Array.isArray(adIds) || adIds.length === 0) {
        return res.status(400).json({ message: "adIds must be a non-empty array." });
      }

      const sessions = await HeatmapModel.getSessionDataByAdIds(adIds);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Error in getSessionDataByAdIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Fetch aggregate data
  getAggregateData: async (req, res) => {
    try {
      const aggregates = await HeatmapModel.getAllAggregateData();
      res.status(200).json(aggregates);
    } catch (error) {
      console.error("Error in getAggregateData:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = HeatmapController;
