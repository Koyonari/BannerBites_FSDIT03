import React, { useState } from "react";
import Navbar from "../Navbar";

const CustomRole = ({ user, onRoleChange }) => {
  const [customRoles, setCustomRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    name: "",
    permissions: { delete: false, edit: false, upload: false, view: false },
  });

  const roles = {
    Operator: {
      delete: false,
      edit: false,
      upload: true,
      view: true,
    },
    Admin: {
      delete: true,
      edit: true,
      upload: true,
      view: true,
    },
  };

  const handleCreateRole = () => {
    if (!newRole.name) {
      alert("Role name is required");
      return;
    }
    setCustomRoles([...customRoles, newRole]);
    setNewRole({
      name: "",
      permissions: { delete: false, edit: false, upload: false, view: false },
    });
  };

  const handlePermissionChange = (perm) => {
    setNewRole({
      ...newRole,
      permissions: {
        ...newRole.permissions,
        [perm]: !newRole.permissions[perm],
      },
    });
  };

  const handleRoleChange = (role) => {
    if (user?.role !== "Admin") {
      alert("Only admins can change roles");
      return;
    }
    if (onRoleChange) onRoleChange(role);
  };

  return (
    <div>
      <Navbar />
      <div className="pt-24 xl:pt-1 px-8 dark:dark-bg">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Role Management
          </h1>

          {/* Role Descriptions */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Role Descriptions
          </h2>
          <div className="space-y-4">
            {Object.entries(roles).map(([roleName, permissions]) => (
              <div
                key={roleName}
                className="border p-4 rounded-md bg-gray-100 dark:bg-gray-700"
              >
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {roleName}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {Object.entries(permissions)
                    .map(([perm, value]) => `${perm}: ${value ? "Yes" : "No"}`)
                    .join(", ")}
                </p>
              </div>
            ))}
          </div>

          {/* Create Custom Role */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-8">
            Create Custom Role
          </h2>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Role Name"
              value={newRole.name}
              onChange={(e) =>
                setNewRole({ ...newRole, name: e.target.value })
              }
              className="p-2 border rounded w-full mb-4 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-4">
              {Object.keys(newRole.permissions).map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 text-gray-800 dark:text-white"
                >
                  <input
                    type="checkbox"
                    checked={newRole.permissions[perm]}
                    onChange={() => handlePermissionChange(perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>
            <button
              onClick={handleCreateRole}
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Create Role
            </button>
          </div>

          {/* Edit Role */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-8">
            Edit Role
          </h2>
          {user?.role === "Admin" ? (
            <div className="mt-4">
              <p className="text-gray-600 dark:text-gray-400">
                Logged in as Admin. You can edit user roles.
              </p>
              <div className="space-y-2 mt-4">
                {customRoles.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border p-4 rounded-md bg-gray-100 dark:bg-gray-700"
                  >
                    <span className="text-gray-800 dark:text-white">
                      {role.name}
                    </span>
                    <button
                      onClick={() => handleRoleChange(role)}
                      className="bg-yellow-500 text-white py-1 px-4 rounded hover:bg-yellow-600"
                    >
                      Edit Role
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-500 mt-4">
              You must be logged in as an Admin to edit roles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomRole;
