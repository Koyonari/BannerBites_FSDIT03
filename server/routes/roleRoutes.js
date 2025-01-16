const express = require("express");
const { fetchRoleAndPermissions } = require("../controllers/rolesController");
const { verifyPermission } = require("../middleware/rolesMiddleware");

const router = express.Router();

// Wrapper to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Fetch role and permissions
router.get("/:role", asyncHandler(fetchRoleAndPermissions));

// Example protected route: require "edit" permission
router.get(
  "/protected/edit",
  asyncHandler(verifyPermission("edit")),
  (req, res) => res.json({ message: "Edit access granted" })
);

module.exports = router;
