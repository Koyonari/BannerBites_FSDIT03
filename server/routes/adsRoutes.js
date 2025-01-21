const express = require("express");
const router = express.Router();
const AdController = require("../controllers/adController");

// Endpoint to batch get ads by adIds
router.post("/batchGet", AdController.batchGetAds);

// Endpoint to get all ads
router.get("/all", AdController.getAllAds);

// Upload Ad (Media + Metadata)
router.post("/upload", AdController.uploadAd);

module.exports = router;
