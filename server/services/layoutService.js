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
    // Step 1: Get layout details
    const layout = await LayoutModel.getLayoutById(layoutId);

    if (!layout) {
      console.warn(`Layout not found for layoutId: ${layoutId}`);
      return null;
    }

    // Step 2: Get grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);

    // Step 3: Get scheduled ads and ad details for each grid item
    const gridItemsWithAds = await Promise.all(
      gridItems.map(async (item) => {
        try {
          const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(
            `${layoutId}#${item.index}`
          );

          // Fetch all ads in parallel
          const adsPromises = scheduledAds.map(async (scheduledAd) => {
            try {
              const adId = scheduledAd.ad?.adId; // Correct access
              if (!adId) {
                console.warn(`ScheduledAd with id: ${scheduledAd.id} is missing 'adId'.`);
                return { ...scheduledAd, ad: null };
              }

              const ad = await AdModel.getAdById(adId);
              if (ad) {
                console.log(`Attached Ad for scheduledAd ID: ${scheduledAd.id}`);
              } else {
                console.warn(`Ad not found for scheduledAd ID: ${scheduledAd.id}, adId: ${adId}`);
              }
              return { ...scheduledAd, ad };
            } catch (adError) {
              console.error(`Error fetching adId: ${scheduledAd.adId} for scheduledAd ID: ${scheduledAd.id}`, adError);
              return { ...scheduledAd, ad: null }; // Handle missing ads gracefully
            }
          });

          const scheduledAdsWithDetails = await Promise.all(adsPromises);
          return { ...item, scheduledAds: scheduledAdsWithDetails };
        } catch (scheduledAdsError) {
          console.error(
            `Error fetching scheduledAds for gridItemId: ${layoutId}#${item.index}`,
            scheduledAdsError
          );
          return { ...item, scheduledAds: [] }; // Handle missing scheduledAds gracefully
        }
      })
    );

    // Assemble the complete layout object
    const completeLayout = { ...layout, gridItems: gridItemsWithAds };
    console.log(`Complete layout fetched for layoutId: ${layoutId}`, completeLayout);
    return completeLayout;
  } catch (error) {
    console.error(`Error fetching layout data for layoutId: ${layoutId}`, error);
    throw error; // Rethrow the error to be handled by the caller
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
