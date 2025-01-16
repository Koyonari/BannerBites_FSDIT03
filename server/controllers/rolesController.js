const { getRoleAndPermissions } = require("../models/RolesModel");

const fetchRoleAndPermissions = async (req, res) => {
  try {
    const { role } = req.params; // Role passed as a route parameter
    const roleData = await getRoleAndPermissions(role);

    res.status(200).json(roleData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { fetchRoleAndPermissions };
