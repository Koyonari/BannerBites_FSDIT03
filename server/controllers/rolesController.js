const {
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAllRoles,
} = require("../models/RolesModel");

const fetchPermissions = async (req, res) => {
  const { role } = req.params;

  try {
    const permissions = await getPermissionsByRole(role);
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch role and its permissions
 */
const fetchRoleAndPermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const roleData = await getRole(role);
    res.status(200).json(roleData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Fetch all roles
 */
const fetchAllRoles = async (req, res) => {
  try {
    const rolesData = await getAllRoles();
    res.status(200).json(rolesData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a new role
 */
const createNewRole = async (req, res) => {
  try {
    const roleData = req.body;
    const newRole = await createRole(roleData);
    res.status(201).json(newRole);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update an existing role's permissions
 */
const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const permissions = req.body.permissions;
    const updatedRole = await updateRole(role, permissions);
    res.status(200).json(updatedRole);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a role
 */
const deleteRoleByName = async (req, res) => {
  try {
    const { role } = req.params;
    const deletedRole = await deleteRole(role);
    res.status(200).json({ message: `Role ${deletedRole} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  fetchRoleAndPermissions,
  fetchAllRoles,
  createNewRole,
  updateRolePermissions,
  deleteRoleByName,
  fetchPermissions,
};
