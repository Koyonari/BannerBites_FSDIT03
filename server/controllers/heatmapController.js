// controllers/heatmapController.js

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

  /**
   * Fetch session data by a single adId.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getSessionDataByAdId: async (req, res) => {
    try {
      const { adId } = req.params;

      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }

      const sessions = await HeatmapModel.getSessionDataByAdId(adId);
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessionDataByAdId:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetch session data for multiple adIds.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getSessionDataByAdIds: async (req, res) => {
    try {
      const { adIds } = req.body;

      if (!Array.isArray(adIds) || adIds.length === 0) {
        return res
          .status(400)
          .json({ message: "adIds must be a non-empty array." });
      }

      const allSessions = [];
      for (const adId of adIds) {
        const sessions = await HeatmapModel.getSessionDataByAdId(adId);
        allSessions.push(...sessions.items);
      }

      res.status(200).json({ sessions: allSessions });
    } catch (error) {
      console.error("Error in getSessionDataByAdIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetch session data by session IDs.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getSessionDataBySessionIds: async (req, res) => {
    try {
      const { sessionIds } = req.body;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res
          .status(400)
          .json({ message: "sessionIds must be a non-empty array." });
      }

      const sessions = await HeatmapModel.getSessionDataBySessionIds(sessionIds);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Error in getSessionDataBySessionIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Dedicated route to test getSessionIdsForAdId function.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getSessionIdsForAdId: async (req, res) => {
    try {
      const { adId } = req.body;

      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }

      const sessions = await HeatmapModel.getSessionIdsForAdId(adId);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Error in getSessionIdsForAdId:", error);
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
