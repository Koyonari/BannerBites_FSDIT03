// models/ScheduledAdModel.js
const {
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const ScheduledAdModel = {
  saveScheduledAd: async (layoutId, gridIndex, scheduledAd) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      Item: {
        gridItemId: `${layoutId}#${gridIndex}`,
        id: scheduledAd.id,
        scheduledTime: scheduledAd.scheduledTime,
        ad: { //Nested ad object
          adId: scheduledAd.ad.adId,
          type: scheduledAd.ad.type,
          content: scheduledAd.ad.content,
          styles: scheduledAd.ad.styles,
        },
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
      IndexName: "AdIdIndex", // Ensure this matches the index name created in the table
      KeyConditionExpression: "adId = :adId",
      ExpressionAttributeValues: {
        ":adId": adId,
      },
      ProjectionExpression: "layoutId, gridItemId, scheduledTime",
    };

    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
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
    try {
      await dynamoDb.send(command);
      console.log(
        `Scheduled ad with gridItemId ${gridItemId} and scheduledTime ${scheduledTime} deleted successfully.`,
      );
    } catch (error) {
      console.error(
        `Error deleting scheduled ad with gridItemId ${gridItemId} and scheduledTime ${scheduledTime}:`,
        error,
      );
      throw error;
    }
  },

  deleteScheduledAdsByLayoutId: async (layoutId) => {
    const scheduledAds =
      await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);
    for (const ad of scheduledAds) {
      await ScheduledAdModel.deleteScheduledAd(ad.gridItemId, ad.scheduledTime);
    }
  },

  deleteOldScheduledAds: async (layoutId, layout) => {
    try {
      const existingScheduledAds =
        await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);

      const updatedScheduledAds = layout.gridItems.flatMap((item) =>
        item.scheduledAds.map((scheduledAd) => ({
          gridItemId: `${layoutId}#${item.index}`,
          scheduledTime: scheduledAd.scheduledTime,
          adId: scheduledAd.ad?.adId, // Use ad.adId
        })),
      );

      const adsToDelete = existingScheduledAds.filter((existingAd) => {
        return !updatedScheduledAds.some(
          (updatedAd) =>
            updatedAd.gridItemId === existingAd.gridItemId &&
            updatedAd.scheduledTime === existingAd.scheduledTime,
        );
      });

      for (const adToDelete of adsToDelete) {
        console.log(
          `Deleting Scheduled Ad with gridItemId ${adToDelete.gridItemId} and scheduledTime ${adToDelete.scheduledTime}`,
        );
        await ScheduledAdModel.deleteScheduledAd(
          adToDelete.gridItemId,
          adToDelete.scheduledTime,
        );
        console.log(
          `Scheduled ad with ID ${adToDelete.adId} deleted successfully.`,
        );
      }
    } catch (error) {
      console.error("Error deleting old scheduled ads:", error);
      throw error;
    }
  },
};

module.exports = ScheduledAdModel;
