import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import Cookies from "js-cookie";

const formatPermissionName = (permission) => {
  // Split by capital letters and join with spaces
  return permission
    .split(/(?=[A-Z])/)
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
};

const RoleCard = ({ role, permissions, onEdit, onDelete }) => (
  <div className="mb-4 rounded-lg border-2 p-6 transition-all duration-200 primary-border light-bg hover:border-blue-500 dark:dark-bg">
    <div className="mb-4 flex items-start justify-between">
      <h3 className="text-xl font-semibold accent-text">{role}</h3>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="rounded bg-[#2d3545] px-4 py-1.5 text-text-dark transition-colors duration-200 hover:bg-[#3a4355]"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="rounded px-4 py-1.5 text-text-dark transition-colors duration-200 alert-bg"
        >
          Delete
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {Object.entries(permissions).map(([key, value]) => (
        <div key={key} className="flex items-center">
          <span className="min-w-[140px] text-gray-400">
            {formatPermissionName(key)}:
          </span>
          <span
            className={`ml-2 ${value ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}
          >
            {value ? "Yes" : "No"}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const CustomRole = () => {
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [defaultRoles, setDefaultRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    role: "",
    permissions: {
      delete: false,
      edit: false,
      createAds: false,
      view: false,
      roleManagement: false,
      uploadAds: false,
      scheduleAds: false,
    },
  });
  const [editMode, setEditMode] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Handle logout logic
  const handleLogout = () => {
    Cookies.remove("authToken"); // Clear the authentication token
    window.location.href = "/login"; // Redirect to login page
  };

  // Retrieve token and decode user permissions on component mount
  useEffect(() => {
    // Retrieve token on page load
    const retrievedToken = Cookies.get("authToken");
    if (!retrievedToken) {
      console.warn("No token found on initial load.");
      return;
    }

    try {
      const decodedToken = jwtDecode(retrievedToken);
      const role = decodedToken.role || "No role detected";
      setToken(retrievedToken);
      setUserRole(role);

      // Fetch permissions based on the decoded role
      fetchPermissions(role);
    } catch (err) {
      console.error("Error decoding token:", err.message);
    }
  }, [token]); // Token changes trigger permission re-fetch

  const fetchPermissions = async (role) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/roles/permissions/${role}`,
      );
      if (!response.ok) {
        throw new Error(`Fetch failed with status: ${response.status}`);
      }
      const data = await response.json();
      setPermissions(data.permissions || {}); // Dynamically set permissions
    } catch (error) {
      console.error("Error fetching permissions:", error.message);
    }
  };

  // Fetch roles from the API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/roles");
        const data = await response.json();
        setDefaultRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // Log permission changes for debugging
  useEffect(() => {
    console.log("Permissions state updated:", permissions);
  }, [permissions]);

  // Handle creating a new role
  const handleCreateRole = async () => {
    if (!newRole.role) {
      alert("Role name is required");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        const createdRole = await response.json();
        setDefaultRoles([...defaultRoles, createdRole]);
        setNewRole({
          role: "",
          permissions: {
            delete: false,
            edit: false,
            upload: false,
            view: false,
          },
        });
      } else {
        console.error("Failed to create role:", await response.text());
      }
    } catch (error) {
      console.error("Error creating role:", error);
    }
  };

  // Handle deleting a role
  const handleDeleteRole = async (roleName) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/roles/${roleName}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setDefaultRoles(defaultRoles.filter((role) => role.role !== roleName));
      } else {
        console.error("Failed to delete role:", await response.text());
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  // Handle editing a role
  const handleEditRole = (role) => {
    setEditMode(true);
    setEditingRole(role);
    setNewRole(role);
  };

  // Handle updating a role
  const handleUpdateRole = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/roles/${editingRole.role}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRole),
        },
      );

      if (response.ok) {
        const updatedRole = await response.json();
        setDefaultRoles(
          defaultRoles.map((role) =>
            role.role === editingRole.role ? updatedRole : role,
          ),
        );
        setEditMode(false);
        setEditingRole(null);
        setNewRole({
          role: "",
          permissions: {
            delete: false,
            edit: false,
            createAds: false,
            view: false,
            roleManagement: false,
            uploadAds: false,
            scheduleAds: false,
          },
        });

        // Reload the page to apply changes
        window.location.reload();
      } else {
        console.error("Failed to update role:", await response.text());
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  // Handle permission change
  const handlePermissionChange = (perm) => {
    setNewRole((prevRole) => ({
      ...prevRole,
      permissions: {
        ...prevRole.permissions,
        [perm]: !prevRole.permissions[perm],
      },
    }));
  };
  return (
    <div className="min-h-screen bg-bg-light text-text-dark dark:bg-bg-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold accent-text">
            Role Management
          </h1>
          <p className="text-lg primary-text dark:neutral-text">
            Current Role: {userRole || "No role detected"}
          </p>
          {/* Conditional Logout Button */}
          {token && (
            <button
              onClick={handleLogout}
              className="mt-4 rounded-lg px-4 py-2 text-base-white transition-all alert-bg hover:opacity-90"
            >
              Logout
            </button>
          )}

          {/* Permission-specific buttons with improved styling */}
          <div className="mt-4 flex flex-wrap gap-4">
            {permissions?.view && permissions?.view !== "No" && (
              <button
                onClick={() => (window.location.href = "/layouts")}
                className="rounded-lg px-4 py-2 text-base-white transition-all primary-bg hover:opacity-90"
              >
                View Ads
              </button>
            )}

            {permissions?.roleManagement &&
              permissions?.roleManagement !== "No" && (
                <button
                  onClick={() => (window.location.href = "/ad")}
                  className="rounded-lg px-4 py-2 text-base-white transition-all primary-bg hover:opacity-90"
                >
                  Create Ad
                </button>
              )}

            {permissions?.edit && permissions?.edit !== "No" && (
              <button
                onClick={() => (window.location.href = "/ad")}
                className="rounded-lg px-4 py-2 text-base-white transition-all primary-bg hover:opacity-90"
              >
                Edit Ad
              </button>
            )}

            {permissions?.delete && permissions?.delete !== "No" && (
              <button
                onClick={() => (window.location.href = "/ad")}
                className="rounded-lg px-4 py-2 text-base-white transition-all alert-bg hover:opacity-90"
              >
                Delete Ad
              </button>
            )}
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold primary-text dark:neutral-text">
            Role List
          </h2>
          <div className="space-y-4">
            {defaultRoles.map((roleObj, index) => (
              <RoleCard
                key={index}
                role={roleObj.role}
                permissions={roleObj.permissions}
                onEdit={
                  permissions?.roleManagement
                    ? () => handleEditRole(roleObj)
                    : null
                }
                onDelete={
                  permissions?.roleManagement
                    ? () => handleDeleteRole(roleObj.role)
                    : null
                }
              />
            ))}
          </div>
        </section>

        {permissions?.roleManagement && (
          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold primary-text dark:neutral-text">
              {editMode ? "Edit Role" : "Create Custom Role"}
            </h2>
            <div className="rounded-lg border-2 bg-bg-light p-6 primary-border dark:bg-bg-dark dark:secondary-border">
              <input
                type="text"
                placeholder="Role Name"
                value={newRole.role}
                onChange={(e) =>
                  setNewRole({ ...newRole, role: e.target.value })
                }
                className="mb-6 w-full rounded border-2 bg-bg-light px-4 py-2 text-text-light primary-border placeholder-primary focus:border-bg-accent focus:outline-none dark:bg-bg-dark dark:text-text-dark dark:secondary-border"
                disabled={editMode}
              />

              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {Object.keys(permissions).map((perm) => (
                  <label
                    key={perm}
                    className="flex cursor-pointer items-center space-x-2 text-text-light transition-colors hover:text-text-accent dark:text-text-dark"
                  >
                    <input
                      type="checkbox"
                      checked={newRole.permissions[perm] || false}
                      onChange={() => handlePermissionChange(perm)}
                      className="form-checkbox border-primary dark:border-secondary h-4 w-4 rounded accent-bg"
                    />
                    <span>{formatPermissionName(perm)}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={editMode ? handleUpdateRole : handleCreateRole}
                className="rounded px-6 py-2 text-text-dark transition-colors duration-200 primary-bg hover:bg-bg-subaccent"
              >
                {editMode ? "Update Role" : "Create Role"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomRole;
