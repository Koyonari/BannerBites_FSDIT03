// controllers/rolesController.js
const { getRole } = require("../models/RolesModel");

const fetchRoleAndPermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const roleData = await getRole(role);
    res.status(200).json(roleData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { fetchRoleAndPermissions };