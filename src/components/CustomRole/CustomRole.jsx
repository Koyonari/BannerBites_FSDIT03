import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import ExpandableCard from "./ExpandableCard";
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
    window.location.reload(); // Refresh the page to reflect the logout state
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
  const formatPermissionName = (permission) => {
    return permission
      .split(/(?=[A-Z])/)
      .join(" ")
      .replace(/^\w/, (c) => c.toUpperCase());
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
          {token && (
            <button
              onClick={handleLogout}
              className="mt-4 rounded-lg px-4 py-2 text-base-white transition-all alert-bg hover:opacity-90"
            >
              Logout
            </button>
          )}

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
              <ExpandableCard
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
          <section className="mt-12 rounded-xl border-2 bg-white p-8 primary-border dark:bg-bg-dark dark:secondary-border">
            <div className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-700">
              <h2 className="text-2xl font-semibold tracking-tight primary-text dark:neutral-text">
                {editMode ? "Edit Role Settings" : "Create New Role"}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {editMode
                  ? "Modify the permissions for this role. Changes will affect all users with this role."
                  : "Configure a new role with custom permissions for your team members."}
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label
                  htmlFor="roleName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Role Name
                </label>
                <input
                  id="roleName"
                  type="text"
                  placeholder="Enter role name"
                  value={newRole.role}
                  onChange={(e) =>
                    setNewRole({ ...newRole, role: e.target.value })
                  }
                  disabled={editMode}
                  className="w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-700 placeholder-gray-400 shadow-sm primary-border focus:border-bg-accent focus:outline-none focus:ring-1 focus:ring-bg-accent disabled:bg-gray-50 disabled:text-gray-500 dark:bg-bg-dark dark:text-gray-200 dark:placeholder-gray-500 dark:secondary-border"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Permissions
                  </h3>
                  <span className="text-sm text-gray-500">
                    Select the permissions for this role
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.keys(permissions).map((perm) => (
                    <div
                      key={perm}
                      className="relative flex items-center rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`permission-${perm}`}
                          className="select-none font-medium text-gray-700 dark:text-gray-300"
                        >
                          {formatPermissionName(perm)}
                        </label>
                      </div>
                      <div className="ml-3 flex h-5 items-center">
                        <input
                          id={`permission-${perm}`}
                          type="checkbox"
                          checked={newRole.permissions[perm] || false}
                          onChange={() => handlePermissionChange(perm)}
                          className="h-5 w-5 rounded border-2 border-gray-300 text-blue-600 accent-bg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={editMode ? handleUpdateRole : handleCreateRole}
                  className="inline-flex items-center rounded-lg px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 primary-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editMode ? (
                    <>
                      <span>Update Role Settings</span>
                    </>
                  ) : (
                    <>
                      <span>Create New Role</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomRole;
