// controllers/AdAggregateController.js
const AdAggregateModel = require("../models/AdAggregateModel");

const AdAggregateController = {
  /**
   * Fetches all aggregate data from the AdAggregates table.
   */
  getAllAggregateData: async (req, res) => {
    try {
      const aggregates = await AdAggregateModel.getAllAggregateData();
      res.status(200).json(aggregates);
    } catch (error) {
      console.error("Error in getAllAggregateData:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  /**
   * Fetches a single aggregate record by adId.
   */
  getAggregateDataByAdId: async (req, res) => {
    try {
      const { adId } = req.params;
      if (!adId) {
        return res.status(400).json({ message: "adId is required." });
      }
      const aggregateRecord = await AdAggregateModel.getAggregateDataByAdId(adId);
      if (!aggregateRecord) {
        return res.status(404).json({ message: `No aggregates found for adId: ${adId}` });
      }
      res.status(200).json(aggregateRecord);
    } catch (error) {
      console.error("Error in getAggregateDataByAdId:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = AdAggregateController;
