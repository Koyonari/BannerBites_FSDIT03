// routes/tvRoutes.js
const express = require("express");
const router = express.Router();
const tvController = require("../controllers/tvController");

// POST /api/tvs/:tvId/layouts
// Route to assign a layout to a TV
router.post("/:tvId/layouts", tvController.assignLayoutToTV);

module.exports = router;
