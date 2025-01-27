import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import Cookies from "js-cookie";

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
    <div className="text-primary-text dark:text-secondary-text min-h-screen bg-bg-light dark:bg-bg-dark">
      <Navbar />
      <div className="px-8 pt-24 xl:pt-1">
        <div className="rounded-lg border bg-base-white p-6 shadow-md primary-border dark:bg-bg-dark">
          <h1 className="mb-6 text-2xl font-bold accent-text">
            Role Management
          </h1>
          <h1 className="mb-4 neutral-text">
            Your role: {userRole || "No role detected"}
          </h1>

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

          {/* Role List */}
          <h2 className="mb-4 mt-8 text-xl font-semibold neutral-text">
            Role List
          </h2>
          <div className="space-y-4">
            {defaultRoles.map((roleObj, index) => (
              <div
                key={index}
                className="bg-neutral-bg flex items-center justify-between rounded-md border p-4 primary-border dark:bg-bg-dark"
              >
                <div>
                  <h3 className="text-lg font-bold accent-text">
                    {roleObj.role}
                  </h3>
                  <p className="neutral-text">
                    {Object.entries(roleObj.permissions)
                      .map(
                        ([perm, value]) => `${perm}: ${value ? "Yes" : "No"}`,
                      )
                      .join(", ")}
                  </p>
                </div>

                {permissions?.roleManagement && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditRole(roleObj)}
                      className="bg-secondary-bg rounded px-3 py-1 text-base-white transition-all hover:opacity-90"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(roleObj.role)}
                      className="rounded px-3 py-1 text-base-white transition-all alert-bg hover:opacity-90"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create or Edit Role */}
          {permissions?.roleManagement && (
            <>
              <h2 className="mb-4 mt-8 text-xl font-semibold neutral-text">
                {editMode ? "Edit Role" : "Create Custom Role"}
              </h2>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Role Name"
                  value={newRole.role}
                  onChange={(e) =>
                    setNewRole({ ...newRole, role: e.target.value })
                  }
                  className="mb-4 w-full rounded border bg-base-white p-2 primary-border placeholder-primary ring-primary focus:outline-none focus:ring-2 dark:bg-bg-dark"
                  disabled={editMode}
                />
                <div className="mb-4 flex flex-wrap gap-4">
                  {Object.keys(permissions).map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 neutral-text"
                    >
                      <input
                        type="checkbox"
                        checked={newRole.permissions[perm] || false}
                        onChange={() => handlePermissionChange(perm)}
                        className="accent-primary"
                      />
                      {perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </label>
                  ))}
                </div>
                <button
                  onClick={editMode ? handleUpdateRole : handleCreateRole}
                  className={`rounded px-4 py-2 text-base-white transition-all hover:opacity-90 ${editMode ? "primary-bg" : "secondary-bg"} `}
                >
                  {editMode ? "Update Role" : "Create Role"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomRole;
