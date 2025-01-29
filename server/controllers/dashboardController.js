const DashboardModel = require("../models/DashboardModel");

const dashboardController = {
  getAdAggregates: async (req, res) => {
    try {
      const data = await DashboardModel.fetchAdAggregates();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ad aggregates" });
    }
  },
};

module.exports = dashboardController;