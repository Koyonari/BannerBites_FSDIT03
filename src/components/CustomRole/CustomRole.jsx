import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import Cookies from "js-cookie";

const token = Cookies.get("authToken"); // Assuming the token is stored in cookies
let userRole = null;

if (token) {
  try {
    const decodedToken = jwtDecode(token);
    userRole = decodedToken.role; // Ensure the token contains a "role" field
  } catch (err) {
    console.error("Error decoding token:", err);
  }
} else {
  console.warn("No token found");
}

console.log("User Role:", userRole); // Should display the role, e.g., "Operator"


const CustomRole = ({ user, onRoleChange }) => {
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [customRoles, setCustomRoles] = useState([]);
  const [defaultRoles, setDefaultRoles] = useState([]);
  const [newRole, setNewRole] = useState({
    role: "",
    permissions: { delete: false, edit: false, upload: false, view: false },
  });

  const [editMode, setEditMode] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  //Check if token exists in cookies
  useEffect(() => {
    const retrievedToken = Cookies.get("authToken");
    console.log("Token from Cookies:", retrievedToken); // Log token
    setToken(retrievedToken);

    if (retrievedToken) {
      try {
        const decodedToken = jwtDecode(retrievedToken);
        console.log("Decoded Token:", decodedToken); // Log the decoded token
        setUserRole(decodedToken.role || "No role detected");
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    } else {
      console.warn("No token found");
    }
  }, []);

  // Decode token and set user role
  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token); // Decode the token
        console.log("Decoded Token:", decodedToken); // Log the decoded token to verify its structure
        setUserRole(decodedToken.role || "No role detected"); // Use 'roles' field from token
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    } else {
      console.warn("No token found");
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Fetch roles from the API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/roles");
        const data = await response.json();
        setDefaultRoles(data); // Use API response
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
    fetchRoles();
  }, []);

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

  // Handle starting the edit process
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
    setNewRole({
      ...newRole,
      permissions: {
        ...newRole.permissions,
        [perm]: !newRole.permissions[perm],
      },
    });
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
                      .map(([perm, value]) => `${perm.toUpperCase()}: ${value ? "Yes" : "No"}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRole(roleObj)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(roleObj.role)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create or Edit Role */}
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
              onClick={editMode ? handleUpdateRole : handleCreateRole}
              className={`mt-4 py-2 px-4 rounded ${
                editMode ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {editMode ? "Update Role" : "Create Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomRole;
