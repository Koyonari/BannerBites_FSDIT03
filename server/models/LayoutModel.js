  // models/LayoutModel.js
  const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
  const { dynamoDb } = require("../middleware/awsClients");

  const LayoutModel = {
    // Function to save a layout
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
      // Use the PutCommand to save the layout in DynamoDB
      const command = new PutCommand(params);
      return await dynamoDb.send(command);
    },
    // Function to update a layout
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
      // Update the layout in DynamoDB
      const command = new UpdateCommand(params);
      return await dynamoDb.send(command);
    },
    // Function to retrieve a layout by layoutId
    getLayoutById: async (layoutId) => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Key: { layoutId },
      };
      // Use the GetCommand to fetch the layout from DynamoDB
      const command = new GetCommand(params);
      const data = await dynamoDb.send(command);
      return data.Item;
    },
    // Function to retrieve all layouts
    getAllLayouts: async () => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      };
      // Use the ScanCommand to fetch all layouts from DynamoDB
      const command = new ScanCommand(params);
      const data = await dynamoDb.send(command);
      return data.Items;
    },
    // Function to delete a layout by
    deleteLayout: async (layoutId) => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
        Key: { layoutId },
      };
      // Use the DeleteCommand to delete the layout from DynamoDB
      const command = new DeleteCommand(params);
      try {
        await dynamoDb.send(command);
        console.log(`Layout with layoutId ${layoutId} deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting layout with layoutId ${layoutId}:`, error);
        throw error;
      }
    },
  };

  module.exports = LayoutModel;
