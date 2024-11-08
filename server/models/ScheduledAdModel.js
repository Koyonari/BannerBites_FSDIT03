// models/ScheduledAdModel.js
const { PutCommand, DeleteCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const ScheduledAdModel = {
  saveScheduledAd: async (layoutId, gridIndex, scheduledAd) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      Item: {
        gridItemId: `${layoutId}#${gridIndex}`,
        scheduledTime: scheduledAd.scheduledTime,
        adId: scheduledAd.ad.id,
        index: gridIndex,
        layoutId: layoutId,
      },
    };
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },

  getScheduledAdsByGridItemId: async (gridItemId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      KeyConditionExpression: "gridItemId = :gridItemId",
      ExpressionAttributeValues: {
        ":gridItemId": gridItemId,
      },
    };
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  getScheduledAdsByLayoutId: async (layoutId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      FilterExpression: "layoutId = :layoutId",
      ExpressionAttributeValues: {
        ":layoutId": layoutId,
      },
    };
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  getScheduledAdsByAdId: async (adId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      IndexName: "AdIdIndex", // Name of the GSI
      KeyConditionExpression: "adId = :adId",
      ExpressionAttributeValues: {
        ":adId": { S: adId },
      },
      ProjectionExpression: "layoutId",
    };
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items.map((item) => item.layoutId.S);
  },

  deleteScheduledAd: async (gridItemId, scheduledTime) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      Key: {
        gridItemId,
        scheduledTime,
      },
    };
    const command = new DeleteCommand(params);
    return await dynamoDb.send(command);
  },
};

module.exports = ScheduledAdModel;
