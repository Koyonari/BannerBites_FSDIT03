// routes/adAnalyticsRoutes.js

const express = require("express");
const router = express.Router();
const AdAnalyticsController = require("../controllers/adAnalyticsController");

// Route to fetch all session data
router.get("/sessionData", AdAnalyticsController.getAllSessionData);

// Route to fetch session data for a single adId (adId provided as a URL parameter)
router.get("/sessionDataByAdId/:adId", AdAnalyticsController.getSessionDataByAdId);

// Route to fetch session data for multiple adIds (POST request with adIds in the body)
router.post("/sessionDataByAdIds", AdAnalyticsController.getSessionDataByAdIds);

// Route to get session IDs for a single adId (POST request with adId in the body)
router.post("/getSessionIdsForAdId", AdAnalyticsController.getSessionIdsForAdId);

module.exports = router;
