// routes/layoutRoutes.js
const express = require("express");
const router = express.Router();
const layoutController = require("../controllers/layoutController");

// POST /api/layouts/save
router.post("/save", layoutController.saveLayout);

// PUT /api/layouts/:layoutId
router.put("/:layoutId", layoutController.updateLayout);

// GET /api/layouts
router.get("/", layoutController.getAllLayouts);

// GET /api/layouts/:layoutId
router.get("/:layoutId", layoutController.getLayoutById);

module.exports = router;
