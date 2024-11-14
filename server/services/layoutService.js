// services/layoutService.js

const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { dynamoDb } = require("../middleware/awsClients");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

/**
 * Fetch the complete layout data by layoutId, including gridItems and scheduledAds.
 * Utilizes parallel fetching to improve performance.
 * @param {string} layoutId - The ID of the layout to fetch.
 * @returns {Object|null} - The complete layout object or null if not found.
 */
const fetchLayoutById = async (layoutId) => {
  try {
    console.log(`Fetching layout details for layoutId: ${layoutId}`);
    
    // Step 1: Fetch layout from LayoutModel
    const layout = await LayoutModel.getLayoutById(layoutId);
    if (!layout) {
      console.error(`Layout not found for layoutId: ${layoutId}`);
      return null;
    }
    console.log(`Fetched layout: ${JSON.stringify(layout)}`);

    // Step 2: Fetch all GridItems related to this layout
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);
    if (!gridItems || gridItems.length === 0) {
      console.error(`No grid items found for layoutId: ${layoutId}`);
    }

    // Step 3: Gather all gridItemIds to fetch related scheduled ads
    const gridItemIds = gridItems.map((item) => `${layoutId}#${item.index}`);
    const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemIds(gridItemIds);

    // Step 4: Collect unique adIds from scheduledAds to batch fetch ad details
    const adIdsSet = new Set();
    scheduledAds.forEach((scheduledAd) => {
      if (scheduledAd.adId) {
        adIdsSet.add(scheduledAd.adId);
      }
    });
    const adIds = Array.from(adIdsSet);

    // Step 5: Fetch ads from Ads table
    const ads = await AdModel.getAdsByIds(adIds);
    console.log(`Fetched ads: ${JSON.stringify(ads)}`); // Add debug statement here
    const adsMap = new Map(ads.map((ad) => [ad.adId, ad]));

    // Step 6: Populate scheduledAds in grid items with ad details
    for (const item of gridItems) {
      item.scheduledAds = scheduledAds.filter((scheduledAd) => scheduledAd.gridItemId === item.gridItemId);

      item.scheduledAds.forEach((scheduledAd) => {
        if (scheduledAd.adId) {
          const adDetails = adsMap.get(scheduledAd.adId);
          scheduledAd.ad = {
            adId: scheduledAd.adId,
            ...(adDetails ? { content: adDetails.content, styles: adDetails.styles, type: adDetails.type } : {}),
          };
        } else {
          scheduledAd.ad = null;
        }
      });
    }

    // Step 7: Attach grid items back to the layout
    layout.gridItems = gridItems;

    return layout;
  } catch (error) {
    console.error(`Error fetching layout data for layoutId: ${layoutId}`, error);
    throw error;
  }
};


/**
* Map adId to layoutIds.
* This function should return all layoutIds that include the specified adId.
* Utilizes a table scan as a fallback in the absence of a GSI.
* @param {string} adId - The ID of the ad.
* @returns {Array<string>} - An array of associated layoutIds.
*/
const getLayoutsByAdId = async (adId) => {
 try {
   // Scan the ScheduledAds table to find all entries with the specified adId
   const params = {
     TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
     FilterExpression: "adId = :adId",
     ExpressionAttributeValues: {
       ":adId": adId,
     },
   };

   const command = new ScanCommand(params);
   const data = await dynamoDb.send(command);

   if (!data || !data.Items) {
     console.warn(`No layouts found for adId: ${adId}`);
     return [];
   }

   // Extract unique layoutIds from the scheduled ads that include the specified adId
   const layoutIds = [...new Set(data.Items.map((item) => item.layoutId))];
   return layoutIds;
 } catch (error) {
   console.error(`Error mapping adId to layoutIds for adId: ${adId}`, error);
   return [];
 }
};

module.exports = { fetchLayoutById, getLayoutsByAdId };
