// models/GridItemModel.js
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const GridItemModel = {
  // Function to save a grid item
  saveGridItem: async (layoutId, gridItem) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      Item: {
        layoutId: layoutId,
        index: gridItem.index,
        row: gridItem.row,
        column: gridItem.column,
        scheduledAds: gridItem.scheduledAds,
        isMerged: gridItem.isMerged,
        rowSpan: gridItem.rowSpan,
        colSpan: gridItem.colSpan,
        hidden: gridItem.hidden,
        // Add other necessary fields
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },

  // Function to update a grid item
  updateGridItem: async (layoutId, index, gridItem) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      Key: { layoutId, index },
      UpdateExpression:
        "set #row = :row, #column = :column, #scheduledAds = :scheduledAds, #isMerged = :isMerged, #rowSpan = :rowSpan, #colSpan = :colSpan, #hidden = :hidden",
      ExpressionAttributeNames: {
        "#row": "row",
        "#column": "column",
        "#scheduledAds": "scheduledAds",
        "#isMerged": "isMerged",
        "#rowSpan": "rowSpan",
        "#colSpan": "colSpan",
        "#hidden": "hidden",
      },
      ExpressionAttributeValues: {
        ":row": gridItem.row,
        ":column": gridItem.column,
        ":scheduledAds": gridItem.scheduledAds,
        ":isMerged": gridItem.isMerged,
        ":rowSpan": gridItem.rowSpan,
        ":colSpan": gridItem.colSpan,
        ":hidden": gridItem.hidden,
      },
    };
    // Update the grid item in DynamoDB
    const command = new UpdateCommand(params);
    return await dynamoDb.send(command);
  },

  // Function to retrieve a grid item by layoutId and index
  getGridItemById: async (layoutId, index) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      Key: { layoutId, index },
    };
    // Retrieve the grid item from DynamoDB
    const command = new GetCommand(params);
    const data = await dynamoDb.send(command);
    return data.Item;
  },

  // Function to retrieve all grid items by layoutId
  getGridItemsByLayoutId: async (layoutId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      KeyConditionExpression: "layoutId = :layoutId",
      ExpressionAttributeValues: {
        ":layoutId": layoutId,
      },
    };
    // Retrieve all grid items for the layout from DynamoDB
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  // Function to delete a grid item by layoutId and index
  deleteGridItem: async (layoutId, index) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      Key: { layoutId, index },
    };
    // Delete the grid item from DynamoDB
    const command = new DeleteCommand(params);
    return await dynamoDb.send(command);
  },
};

module.exports = GridItemModel;
