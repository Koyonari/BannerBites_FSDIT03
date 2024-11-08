// controllers/layoutController.js
const LayoutModel = require("../models/LayoutModel");
const GridItemModel = require("../models/GridItemModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const AdModel = require("../models/AdModel");
const { generatePresignedUrl } = require("../services/s3Service");

const generatePresignedUrlController = async (req, res) => {
  const { fileName, contentType } = req.body;

  // Determine the folder based on content type
  let folder;
  if (contentType.startsWith("image/")) {
    folder = "images";
  } else if (contentType.startsWith("video/")) {
    folder = "videos";
  } else {
    return res.status(400).json({ error: "Unsupported content type" });
  }

  // Generate the S3 key
  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
    const url = await generatePresignedUrl(
      process.env.S3_BUCKET_NAME,
      key,
      contentType,
      300,
    );
    res.json({ url, key });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: error.message });
  }
};

const saveLayout = async (req, res) => {
  console.log("Request to /api/saveLayout:", JSON.stringify(req.body, null, 2));

  try {
    const layout = req.body;

    // Validate layout data
    if (!layout || !layout.layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    // Step 1: Save layout details
    await LayoutModel.saveLayout(layout);
    console.log(`Layout ${layout.layoutId} saved successfully.`);

    // Track unique ads
    const uniqueAds = new Set();

    // Step 2: Save each grid item and scheduled ads
    for (const item of layout.gridItems) {
      await GridItemModel.saveGridItem(layout.layoutId, item);
      console.log(`Grid item at index ${item.index} saved successfully.`);

      // Step 3: Save scheduled ads
      for (const scheduledAd of item.scheduledAds) {
        await ScheduledAdModel.saveScheduledAd(
          layout.layoutId,
          item.index,
          scheduledAd,
        );
        console.log(`Scheduled ad ${scheduledAd.ad.id} saved successfully.`);

        // Step 4: Save unique ads
        if (!uniqueAds.has(scheduledAd.ad.id)) {
          await AdModel.saveAd(scheduledAd.ad);
          console.log(`Ad ${scheduledAd.ad.id} saved successfully.`);
          uniqueAds.add(scheduledAd.ad.id);
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Layout and related items saved successfully." });
  } catch (error) {
    console.error("Error saving layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const updateLayout = async (req, res) => {
  console.log(
    "Request to /api/layouts/:layoutId:",
    JSON.stringify(req.body, null, 2),
  );

  try {
    const { layoutId } = req.params;
    const layout = req.body;

    // Validate layout data
    if (!layout || !layout.layoutId || layout.layoutId !== layoutId) {
      console.error("Invalid layout data received:", layout);
      return res.status(400).json({ message: "Invalid layout data." });
    }

    // Step 1: Fetch existing scheduled ads
    const existingScheduledAds =
      await ScheduledAdModel.getScheduledAdsByLayoutId(layoutId);

    // Step 2: Find scheduled ads to delete
    const updatedScheduledAds = layout.gridItems.flatMap((item) =>
      item.scheduledAds.map((scheduledAd) => ({
        gridItemId: `${layoutId}#${item.index}`,
        scheduledTime: scheduledAd.scheduledTime,
        adId: scheduledAd.ad?.id,
      })),
    );

    const adsToDelete = existingScheduledAds.filter((existingAd) => {
      return !updatedScheduledAds.some(
        (updatedAd) =>
          updatedAd.gridItemId === existingAd.gridItemId &&
          updatedAd.scheduledTime === existingAd.scheduledTime,
      );
    });

    // Step 3: Delete old scheduled ads
    for (const adToDelete of adsToDelete) {
      await ScheduledAdModel.deleteScheduledAd(
        adToDelete.gridItemId,
        adToDelete.scheduledTime,
      );
      console.log(
        `Scheduled ad with ID ${adToDelete.adId} deleted successfully.`,
      );
    }

    // Step 4: Update layout details
    await LayoutModel.saveLayout(layout);
    console.log(`Layout ${layout.layoutId} updated successfully.`);

    // Track unique ads
    const uniqueAds = new Set();

    // Step 5: Save grid items and scheduled ads
    for (const item of layout.gridItems) {
      await GridItemModel.saveGridItem(layout.layoutId, item);
      console.log(`Grid item at index ${item.index} updated successfully.`);

      for (const scheduledAd of item.scheduledAds) {
        if (!scheduledAd.ad || !scheduledAd.ad.id) {
          console.error(
            `Missing id for scheduled ad at grid item index ${item.index}`,
          );
          continue;
        }

        await ScheduledAdModel.saveScheduledAd(
          layout.layoutId,
          item.index,
          scheduledAd,
        );
        console.log(`Scheduled ad ${scheduledAd.ad.id} updated successfully.`);

        if (!uniqueAds.has(scheduledAd.ad.id)) {
          await AdModel.saveAd(scheduledAd.ad);
          console.log(`Ad ${scheduledAd.ad.id} saved successfully.`);
          uniqueAds.add(scheduledAd.ad.id);
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Layout and related items updated successfully." });
  } catch (error) {
    console.error("Error updating layout and related items:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getAllLayouts = async (req, res) => {
  try {
    const layouts = await LayoutModel.getAllLayouts();
    res.json(layouts);
  } catch (error) {
    console.error("Error fetching layouts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getLayoutById = async (req, res) => {
  const { layoutId } = req.params;

  try {
    const layout = await fetchLayoutById(layoutId);

    if (!layout) {
      return res.status(404).json({ message: "Layout not found." });
    }

    res.json(layout);
  } catch (error) {
    console.error("Error fetching layout data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

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
        `${layoutId}#${item.index}`,
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

module.exports = {
  generatePresignedUrlController,
  saveLayout,
  updateLayout,
  getAllLayouts,
  getLayoutById,
  fetchLayoutById,
};
