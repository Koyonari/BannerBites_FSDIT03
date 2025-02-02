// controllers/AdAnalyticsController.js
const AdAnalyticsModel = require("../models/AdAnalyticsModel");

const AdAnalyticsController = {
  /**
   * Fetches all session data from the AdAnalytics table.
   */
  getAllSessionData: async (req, res) => {
    try {
      const sessions = await AdAnalyticsModel.getAllSessionData();
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getAllSessionData:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetches session data for a specific adId.
   */
  getSessionDataByAdId: async (req, res) => {
    try {
      const { adId } = req.params;
      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }
      const sessions = await AdAnalyticsModel.getSessionDataByAdId(adId);
      res.status(200).json(sessions);
    } catch (error) {
      console.error("Error in getSessionDataByAdId:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetches session data for multiple adIds.
   */
  getSessionDataByAdIds: async (req, res) => {
    try {
      const { adIds } = req.body;
      if (!Array.isArray(adIds) || adIds.length === 0) {
        return res.status(400).json({ message: "adIds must be a non-empty array." });
      }
      const allSessions = [];
      for (const adId of adIds) {
        const sessions = await AdAnalyticsModel.getSessionDataByAdId(adId);
        allSessions.push(...sessions.items);
      }
      res.status(200).json({ sessions: allSessions });
    } catch (error) {
      console.error("Error in getSessionDataByAdIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetches session data by an array of session IDs.
   */
  getSessionDataBySessionIds: async (req, res) => {
    try {
      const { sessionIds } = req.body;
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ message: "sessionIds must be a non-empty array." });
      }
      const sessions = await AdAnalyticsModel.getSessionDataBySessionIds(sessionIds);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Error in getSessionDataBySessionIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetches session IDs for a given adId.
   */
  getSessionIdsForAdId: async (req, res) => {
    try {
      const { adId } = req.body;
      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }
      const sessions = await AdAnalyticsModel.getSessionIdsForAdId(adId);
      res.status(200).json({ sessions });
    } catch (error) {
      console.error("Error in getSessionIdsForAdId:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = AdAnalyticsController;
