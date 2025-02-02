// models/ScheduledAdModel.js
const {
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("../middleware/awsClients");

const ScheduledAdModel = {
  // Function to save a scheduled ad
  saveScheduledAd: async (layoutId, gridIndex, scheduledAd) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      Item: {
        gridItemId: `${layoutId}#${gridIndex}`,
        id: scheduledAd.id,
        scheduledTime: scheduledAd.scheduledTime,
        adId: scheduledAd.adId, // Store adId reference
        index: gridIndex,
        layoutId: layoutId,
      },
    };
    // Use the PutCommand to save the scheduled ad in DynamoDB
    const command = new PutCommand(params);
    return await dynamoDb.send(command);
  },
  
  // Function to retrieve all scheduled ads
  getScheduledAdsByGridItemId: async (gridItemId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      KeyConditionExpression: "gridItemId = :gridItemId",
      ExpressionAttributeValues: {
        ":gridItemId": gridItemId,
      },
    };
    // Use the QueryCommand to fetch the scheduled ads from DynamoDB
    const command = new QueryCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  getScheduledAdsByGridItemIds: async (gridItemIds) => {
    const scheduledAds = [];

    // Loop through each gridItemId to fetch all ads related to it
    for (const gridItemId of gridItemIds) {
      const params = {
        TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
        KeyConditionExpression: "gridItemId = :gridItemId",
        ExpressionAttributeValues: {
          ":gridItemId": gridItemId,
        },
      };

      try {
        const command = new QueryCommand(params);
        const data = await dynamoDb.send(command);
        scheduledAds.push(...data.Items);
      } catch (error) {
        console.error(
          `Error fetching scheduled ads for gridItemId: ${gridItemId}`,
          error,
        );
        throw error;
      }
    }

    return scheduledAds;
  },

  // Function to retrieve all scheduled ads
  getScheduledAdsByLayoutId: async (layoutId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      FilterExpression: "layoutId = :layoutId",
      ExpressionAttributeValues: {
        ":layoutId": layoutId,
      },
    };
    // Use the ScanCommand to fetch the scheduled ads from DynamoDB
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  // Function to retrieve all scheduled ads
  getScheduledAdsByAdId: async (adId) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      FilterExpression: "adId = :adId",
      ExpressionAttributeValues: {
        ":adId": adId,
      },
      ProjectionExpression: "layoutId, gridItemId, scheduledTime, adId",
    };
    // Use the ScanCommand to fetch the scheduled ads from DynamoDB
    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    return data.Items;
  },

  // Function to delete a scheduled ad
  deleteScheduledAd: async (gridItemId, scheduledTime) => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      Key: {
        gridItemId,
        scheduledTime,
      },
    };
    // Use the DeleteCommand to delete the scheduled ad from DynamoDB
    const command = new DeleteCommand(params);
    console.log(
      `Attempting to delete scheduled ad with params: ${JSON.stringify(params)}`,
    );
    try {
      const response = await dynamoDb.send(command);
      console.log(
        `Scheduled ad with gridItemId ${gridItemId} and scheduledTime ${scheduledTime} deleted successfully.`,
      );
      console.log("Deletion response:", response);
    } catch (error) {
      console.error(
        `Error deleting scheduled ad with gridItemId ${gridItemId} and scheduledTime ${scheduledTime}:`,
        error,
      );
      throw error;
    }
  },

  // Function to delete all scheduled ads by layoutId
  deleteScheduledAdsByLayoutId: async (layoutId) => {
    // Retrieve all scheduled ads by layoutId
    const scheduledAds =
      await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);
    // Delete each scheduled ad
    for (const ad of scheduledAds) {
      await ScheduledAdModel.deleteScheduledAd(ad.gridItemId, ad.scheduledTime);
    }
  },

  deleteScheduledAdsByAdId: async (adId) => {
    // Scan for scheduled ads with the given adId
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
      FilterExpression: "adId = :adId",
      ExpressionAttributeValues: { ":adId": adId },
    };
    const scanCommand = new ScanCommand(scanParams);
    const data = await dynamoDb.send(scanCommand);
    const scheduledAds = data.Items || [];

    // Delete each scheduled ad found
    for (const ad of scheduledAds) {
      const deleteParams = {
        TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
        Key: {
          gridItemId: ad.gridItemId,
          scheduledTime: ad.scheduledTime,
        },
      };
      const deleteCommand = new DeleteCommand(deleteParams);
      await dynamoDb.send(deleteCommand);
    }
  },

  // Function to delete redundant scheduled ads by adId
  deleteOldScheduledAds: async (layoutId, layout) => {
    try {
      // Retrieve all existing scheduled ads by layoutId
      const existingScheduledAds =
        await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);
      // Extract the scheduled ads from the updated layout
      const updatedScheduledAds = layout.gridItems.flatMap((item) =>
        item.scheduledAds.map((scheduledAd) => ({
          gridItemId: `${layoutId}#${item.index}`,
          scheduledTime: scheduledAd.scheduledTime,
          adId: scheduledAd.ad?.adId, // Use ad.adId
        })),
      );
      // Find the scheduled ads to delete
      const adsToDelete = existingScheduledAds.filter((existingAd) => {
        return !updatedScheduledAds.some(
          (updatedAd) =>
            updatedAd.gridItemId === existingAd.gridItemId &&
            updatedAd.scheduledTime === existingAd.scheduledTime,
        );
      });
      // Delete the redundant scheduled ads
      for (const adToDelete of adsToDelete) {
        console.log(
          `Deleting Scheduled Ad with gridItemId ${adToDelete.gridItemId} and scheduledTime ${adToDelete.scheduledTime}`,
        );
        // Delete the scheduled ad
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
