// routes/rolesRoutes.js
const express = require("express");
const { fetchRoleAndPermissions } = require("../controllers/rolesController");
const { verifyPermission } = require("../middleware/rolesMiddleware");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/:role", asyncHandler(fetchRoleAndPermissions));

router.get(
  "/protected/edit",
  asyncHandler(verifyPermission("edit")),
  (req, res) => res.json({ message: "Edit access granted" })
);

module.exports = router;