import {jwtDecode} from "jwt-decode";

/**
 * Decodes the JWT token and extracts the role.
 * @param {string} token - The JWT token.
 * @returns {string|null} - The role or null if decoding fails.
 */
export const decodeRoleFromToken = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.role || null;
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
};

/**
 * Fetches permissions for a given role from the API.
 * @param {string} role - The role to fetch permissions for.
 * @returns {Promise<Object>} - The fetched permissions object.
 */
export const fetchPermissions = async (role) => {
  try {
    const response = await fetch(`http://localhost:5000/api/roles/permissions/${role}`);
    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data.permissions || {};
  } catch (error) {
    console.error("Error fetching permissions:", error.message);
    return {};
  }
};

/**
 * Retrieves and returns the permissions for a user based on their JWT token.
 * @param {string} token - The JWT token.
 * @returns {Promise<Object>} - The permissions object.
 */
export const getPermissionsFromToken = async (token) => {
  const role = decodeRoleFromToken(token);
  if (!role) {
    console.warn("No role detected from token.");
    return {};
  }
  return await fetchPermissions(role);
};
