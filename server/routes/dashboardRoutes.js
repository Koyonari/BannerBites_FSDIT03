const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// GET /api/dashboard/adAggregates
router.get("/adAggregates", dashboardController.getAdAggregates);

module.exports = router;