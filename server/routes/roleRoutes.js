// routes/rolesRoutes.js
const express = require("express");
const {
  fetchRoleAndPermissions,
  fetchAllRoles,
  createNewRole,
  updateRolePermissions,
  deleteRoleByName,
} = require("../controllers/rolesController");
const { verifyPermission } = require("../middleware/rolesMiddleware");

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/:role", fetchRoleAndPermissions); // Fetch a specific role
router.get("/", fetchAllRoles); // Fetch all roles
router.post("/", createNewRole); // Create a new role
router.put("/:role", updateRolePermissions); // Update a role's permissions
router.delete("/:role", deleteRoleByName); // Delete a role
router.get("/permissions/:role", fetchPermissions);// Fetch permissions for a specific role


router.get(
  "/protected/edit",
  asyncHandler(verifyPermission("edit")),
  (req, res) => res.json({ message: "Edit access granted" })
);

module.exports = router;