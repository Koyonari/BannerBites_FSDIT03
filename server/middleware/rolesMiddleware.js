const { getRoleAndPermissions } = require("../models/RolesModel");

const verifyPermission = async (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { role } = req.user; // Assume role is decoded from JWT and attached to req.user
      const { permissions } = await getRoleAndPermissions(role);

      if (!permissions[requiredPermission]) {
        return res.status(403).json({ message: "Permission denied" });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};

module.exports = { verifyPermission };
