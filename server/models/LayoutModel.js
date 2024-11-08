// models/LayoutModel.js
const { PutCommand, GetCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const LayoutModel = {
  saveLayout: async (layout) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Item: {
        layoutId: layout.layoutId,
        name: layout.name || "Unnamed Layout",
        rows: layout.rows,
        columns: layout.columns,
        createdAt: layout.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },

  updateLayout: async (layout) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Key: { layoutId: layout.layoutId },
      UpdateExpression: "set #name = :name, #rows = :rows, #columns = :columns, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#rows": "rows",
        "#columns": "columns",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":name": layout.name || "Unnamed Layout",
        ":rows": layout.rows,
        ":columns": layout.columns,
        ":updatedAt": new Date().toISOString(),
      },
    };
    const command = new UpdateCommand(params);
    return await dynamoDb.send(command);
  },

  getLayoutById: async (layoutId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Key: { layoutId },
    };
    const command = new GetCommand(params);
    const data = await dynamoDb.send(command);
    return data.Item;
  },

  getAllLayouts: async () => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
    };
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
};

module.exports = LayoutModel;
