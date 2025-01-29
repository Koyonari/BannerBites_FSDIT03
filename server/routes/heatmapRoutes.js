// routes/heatmapRoutes.js

const express = require("express");
const router = express.Router();
const HeatmapController = require("../controllers/heatmapController");

// Route to fetch all session data
router.get("/sessionData", HeatmapController.getSessionData);

// Route to fetch session data for multiple adIds (use POST to send adIds in the body)
router.post("/sessionDataByAdIds", HeatmapController.getSessionDataByAdIds);

// Route to fetch session data for a single adId (use adId as a URL parameter)
router.get("/sessionDataByAdId/:adId", HeatmapController.getSessionDataByAdId);

// Route to get session IDs for single adId
router.post("/getSessionIdsForAdId", HeatmapController.getSessionIdsForAdId);

// Route to fetch aggregate data
router.get("/aggregateData", HeatmapController.getAggregateData)

module.exports = router;
