const { dynamoDb } = require("../middleware/awsClients");
const { GetCommand } = require("@aws-sdk/client-dynamodb");

// Fetch role and permissions by role name
const getRoleAndPermissions = async (role) => {
  if (!role) {
    throw new Error("Role is required");
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE_ROLES,
    Key: { role: { S: role } },
  };

  const data = await dynamoDb.send(new GetCommand(params));

  if (!data.Item) {
    throw new Error("Role not found");
  }

  // Transform permissions into a plain object
  const permissions = {};
  for (const [key, value] of Object.entries(data.Item.permissions.M)) {
    permissions[key] = value.BOOL;
  }

  return {
    role: data.Item.role.S,
    permissions,
  };
};

module.exports = { getRoleAndPermissions };
