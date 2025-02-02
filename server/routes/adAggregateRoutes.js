// routes/adAggregateRoutes.js

const express = require("express");
const router = express.Router();
const AdAggregateController = require("../controllers/adAggregateController");

// Route to fetch all aggregate data
router.get("/aggregateData", AdAggregateController.getAllAggregateData);

// Route to fetch aggregate data for a single adId (adId provided as a URL parameter)
router.get("/aggregates/:adId", AdAggregateController.getAggregateDataByAdId);

module.exports = router;
