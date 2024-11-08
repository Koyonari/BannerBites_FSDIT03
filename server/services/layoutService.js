// layoutService.js
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");

const fetchLayoutById = async (layoutId) => {
  try {
    // Step 1: Get layout details
    const layout = await LayoutModel.getLayoutById(layoutId);

    if (!layout) {
      return null; // Layout not found
    }

    // Step 2: Get grid items
    const gridItems = await GridItemModel.getGridItemsByLayoutId(layoutId);

    // Step 3: Get scheduled ads and ad details
    for (const item of gridItems) {
      const scheduledAds = await ScheduledAdModel.getScheduledAdsByGridItemId(
        `${layoutId}#${item.index}`
      );

      for (const scheduledAd of scheduledAds) {
        const ad = await AdModel.getAdById(scheduledAd.adId);
        scheduledAd.ad = ad;
      }

      item.scheduledAds = scheduledAds;
    }

    layout.gridItems = gridItems;
    return layout; // Return the layout object
  } catch (error) {
    console.error("Error fetching layout data:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

module.exports = { fetchLayoutById };
