// middleware/rolesMiddleware.js
const { getRole } = require("../models/RolesModel");

const verifyPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { role } = req.user;
      const { permissions } = await getRole(role);
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