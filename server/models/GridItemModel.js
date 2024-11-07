// models/GridItemModel.js
const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsMiddleware");

const GridItemModel = {
  saveGridItem: async (layoutId, item) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      Item: {
        layoutId: layoutId,
        index: item.index,
        row: item.row,
        column: item.column,
        isMerged: item.isMerged,
        rowSpan: item.rowSpan,
        colSpan: item.colSpan,
        ...(item.mergeDirection && { mergeDirection: item.mergeDirection }),
        ...(item.selectedCells && item.selectedCells.length > 0 && { selectedCells: item.selectedCells }),
        ...(item.hidden && { hidden: item.hidden }),
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },

  getGridItemsByLayoutId: async (layoutId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      KeyConditionExpression: "layoutId = :layoutId",
      ExpressionAttributeValues: {
        ":layoutId": layoutId,
      },
    };
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },
};

module.exports = GridItemModel;
