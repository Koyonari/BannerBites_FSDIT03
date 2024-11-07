// routes/locationRoutes.js
const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

// GET /api/locations
router.get("/", locationController.getAllLocations);

// GET /api/locations/:locationId/tvs
router.get("/:locationId/tvs", locationController.getTVsByLocation);

module.exports = router;
