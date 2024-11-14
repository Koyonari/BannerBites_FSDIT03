// routes/layoutRoutes.js
const express = require("express");
const router = express.Router();
const layoutController = require("../controllers/layoutController");

// POST /api/layouts/save
// Route to save a layout
router.post("/save", layoutController.saveLayout);

// PUT /api/layouts/:layoutId
// Route to update a layout
router.put("/:layoutId", layoutController.updateLayout);

// GET /api/layouts
// Route to get all layouts
router.get("/", layoutController.getAllLayouts);

// GET /api/layouts/:layoutId
// Route to get a layout by layoutId
router.get("/:layoutId", layoutController.getLayoutById);

// DELETE /api/layouts/:layoutId - New route to delete a layout
// Route to delete a layout by layoutId
router.delete("/:layoutId", layoutController.deleteLayout);

module.exports = router;
