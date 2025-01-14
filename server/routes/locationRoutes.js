// routes/locationRoutes.js
const express = require("express");
const router = express.Router();
const locationController = require("../controllers/locationController");

// GET /api/locations
// Route to get all locations
router.get("/", locationController.getAllLocations);

// GET /api/locations/:locationId/tvs
// Route to get all TVs by locationId
router.get("/:locationId/tvs", locationController.getTVsByLocation);

module.exports = router;
