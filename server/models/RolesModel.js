const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const dynamoDbClient = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_ROLES;

/**
 * Get a role and its permissions by role name
 * @param {string} role - Role name
 * @returns {Promise<object>} Role data
 */
const getRole = async (role) => {
  if (!role) {
    throw new Error("Role is required");
  }

  const params = {
    TableName: TABLE_NAME,
    Key: { role },
  };

  const command = new GetCommand(params);
  const data = await dynamoDb.send(command);

  if (!data.Item) {
    throw new Error(`Role ${role} not found`);
  }

  return data.Item;
};

/**
 * Add a new role with permissions
 * @param {object} roleData - Role data (e.g., { role: "Operator", permissions: { view: true, edit: false } })
 * @returns {Promise<object>} Added role
 */
const createRole = async (roleData) => {
  if (!roleData.role || !roleData.permissions) {
    throw new Error("Role and permissions are required");
  }

  const params = {
    TableName: TABLE_NAME,
    Item: roleData,
  };

  const command = new PutCommand(params);
  await dynamoDb.send(command);

  return roleData;
};

/**
 * Update an existing role's permissions
 * @param {string} role - Role name
 * @param {object} permissions - Updated permissions
 * @returns {Promise<object>} Updated role
 */
const updateRole = async (role, permissions) => {
  if (!role || !permissions) {
    throw new Error("Role and permissions are required");
  }

  const existingRole = await getRole(role);

  const updatedRole = {
    ...existingRole,
    permissions: { ...existingRole.permissions, ...permissions },
  };

  const params = {
    TableName: TABLE_NAME,
    Item: updatedRole,
  };

  const command = new PutCommand(params);
  await dynamoDb.send(command);

  return updatedRole;
};

/**
 * Delete a role by role name
 * @param {string} role - Role name
 * @returns {Promise<string>} Deleted role name
 */
const deleteRole = async (role) => {
  if (!role) {
    throw new Error("Role is required");
  }

  const params = {
    TableName: TABLE_NAME,
    Key: { role },
  };

  const command = new DeleteCommand(params);
  await dynamoDb.send(command);

  return role;
};

/**
 * Get all roles
 * @returns {Promise<object[]>} List of all roles
 */
const getAllRoles = async () => {
  const params = {
    TableName: TABLE_NAME,
  };

  const command = new ScanCommand(params);
  const data = await dynamoDb.send(command);

  return data.Items || [];
};

module.exports = {
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAllRoles,
};
