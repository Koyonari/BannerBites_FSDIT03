import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import Cookies from "js-cookie";

const CustomRole = ({ user, onRoleChange }) => {
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [defaultRoles, setDefaultRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    role: "",
    permissions: { delete: false, edit: false, upload: false, view: false, roleManagement: false },
  });
  const [editMode, setEditMode] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    // Retrieve token on page load
    const retrievedToken = Cookies.get("authToken");
    if (!retrievedToken) {
      console.warn("No token found on initial load.");
      return;
    }

    console.log("Token retrieved:", retrievedToken);
    setToken(retrievedToken);
  }, []);

  useEffect(() => {
    if (token) {
      console.log("Decoding token...");
      try {
        const decodedToken = jwtDecode(token);
        const role = decodedToken.role || "No role detected";
        setUserRole(role);
        console.log("Role decoded:", role);

        // Fetch permissions for the decoded role
        fetchPermissions(role);
      } catch (err) {
        console.error("Error decoding token:", err.message);
      }
    }
  }, [token]);

  const fetchPermissions = async (role) => {
    try {
      const response = await fetch(`http://localhost:5000/api/roles/permissions/${role}`);
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
          permissions: { delete: false, edit: false, upload: false, view: false },
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
      const response = await fetch(`http://localhost:5000/api/roles/${roleName}`, {
        method: "DELETE",
      });

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
      const response = await fetch(`http://localhost:5000/api/roles/${editingRole.role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        const updatedRole = await response.json();
        setDefaultRoles(
          defaultRoles.map((role) =>
            role.role === editingRole.role ? updatedRole : role
          )
        );
        setEditMode(false);
        setEditingRole(null);
        setNewRole({
          role: "",
          permissions: { delete: false, edit: false, upload: false, view: false },
        });
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
    <div>
      <Navbar />
      <div className="pt-24 xl:pt-1 px-8 dark:dark-bg">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Role Management
          </h1>
          <h1>
            Your role: {userRole || "No role detected"} {/* Display user role */}
          </h1>
  
          {/* Role List */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Role List
          </h2>
          <div className="space-y-4">
            {defaultRoles.map((roleObj, index) => (
              <div
                key={index}
                className="border p-4 rounded-md bg-gray-100 dark:bg-gray-700 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {roleObj.role}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {Object.entries(roleObj.permissions)
                      .map(([perm, value]) => `${perm}: ${value ? "Yes" : "No"}`)
                      .join(", ")}
                  </p>
                </div>
  
                <div className="flex gap-2">
                  {permissions?.edit && (
                    <button
                      onClick={() => handleEditRole(roleObj)}
                      className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                  )}
                  {permissions?.delete && (
                    <button
                      onClick={() => handleDeleteRole(roleObj.role)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
  
          {/* Create or Edit Role */}
          
          {permissions?.roleManagement && (
  <>
    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-8">
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
        className="p-2 border rounded w-full mb-4 dark:bg-gray-700 dark:text-white"
        disabled={editMode}
      />
      <div className="flex gap-4">
        {Object.keys(permissions).map((perm) => (
          <label
            key={perm}
            className="flex items-center gap-2 text-gray-800 dark:text-white"
          >
            <input
              type="checkbox"
              checked={newRole.permissions[perm] || false}
              onChange={() => handlePermissionChange(perm)}
            />
            {perm.charAt(0).toUpperCase() + perm.slice(1)}
          </label>
        ))}
      </div>
      <button
        onClick={editMode ? handleUpdateRole : handleCreateRole}
        className={`mt-4 py-2 px-4 rounded ${
          editMode
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white`}
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
