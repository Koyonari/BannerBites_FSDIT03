// controllers/locationController.js
const LocationModel = require("../models/LocationModel");
const TVModel = require("../models/TVModel");

// Function to retrieve all locations
const getAllLocations = async (req, res) => {
  try {
    // Fetch all locations
    const locations = await LocationModel.getAllLocations();
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Function to retrieve all TVs for a location
const getTVsByLocation = async (req, res) => {
  const { locationId } = req.params;
  try {
    // Check if the index is active
    const indexStatus = await TVModel.getIndexStatus(
      process.env.DYNAMODB_TABLE_TVS,
      "locationId-index"
    );
    // Fetch TVs for location
    let tvs;
    if (indexStatus === "ACTIVE") {
      tvs = await TVModel.getTVsByLocationId(locationId);
    } else {
      console.log("Index still backfilling, using Scan");
      tvs = await TVModel.scanTVsByLocationId(locationId);
    }
    res.json(tvs);
  } catch (error) {
    console.error("Error fetching TVs for location:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllLocations,
  getTVsByLocation,
};
