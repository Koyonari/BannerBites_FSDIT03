const { v4: uuidv4 } = require("uuid"); // Import uuidv4 for generating unique IDs
const AdModel = require("../models/AdModel");
const ScheduledAdModel = require("../models/ScheduledAdModel");
const { generatePresignedUrl } = require("../services/s3Service");

const AdController = {
  // Fetch all ads
  getAllAds: async (req, res) => {
    try {
      const ads = await AdModel.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching all ads:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Upload a new ad (media)
  uploadAd: async (req, res) => {
    try {
      const { fileName, contentType, title, description, type } = req.body;

      // Validate the input data
      if (
        !fileName ||
        !contentType ||
        !type ||
        !["image", "video"].includes(type.toLowerCase())
      ) {
        return res
          .status(400)
          .json({ message: "Invalid or unsupported ad data provided." });
      }

      // Determine the S3 folder
      const folder = type.toLowerCase() === "image" ? "images" : "videos";

      // Generate the S3 key and presigned URL
      const s3Key = `${folder}/${Date.now()}-${fileName}`;
      const s3Url = await generatePresignedUrl(
        process.env.S3_BUCKET_NAME,
        s3Key,
        contentType,
      );

      // Generate a unique adId using uuidv4
      const adId = uuidv4();

      // Prepare the ad data for DynamoDB
      const adData = {
        adId, // Unique adId
        type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
        content: {
          title: title || "Untitled",
          description: description || "",
          s3Key,
          src: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
          s3Bucket: process.env.S3_BUCKET_NAME,
        },
        styles: {}, // Add default empty styles
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the ad in the DynamoDB Ads table
      await AdModel.saveAd(adData);

      // Respond with the presigned URL and saved ad data
      res
        .status(201)
        .json({ message: "Ad uploaded successfully.", s3Url, adData });
    } catch (error) {
      console.error("Error uploading ad:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Batch get ads by IDs
  batchGetAds: async (req, res) => {
    try {
      const { adIds } = req.body;

      if (!adIds || !Array.isArray(adIds)) {
        return res.status(400).json({ message: "Invalid adIds provided." });
      }

      const ads = await AdModel.getAdsByIds(adIds);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching ads by adIds:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // delete Ad by AdId
  deleteAd: async (req, res) => {
    try {
      const { adId } = req.params;
      if (!adId) {
        return res.status(400).json({ message: "Ad ID is required." });
      }

      // Delete the ad from the Ads table
      await AdModel.deleteAdById(adId);

      // Delete any scheduled ad references for this ad
      await ScheduledAdModel.deleteScheduledAdsByAdId(adId);

      // Delete aggregate analytics data
      await HeatmapModel.deleteAggregateDataByAdId(adId);

      // Delete detailed analytics session data
      await HeatmapModel.deleteAnalyticsDataByAdId(adId);

      res.status(200).json({
        message: `Ad with ID ${adId} and its scheduled references deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting ad:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // Update Preuplaoded Ad Metadata
  updateAdMetadata: async (req, res) => {
    try {
      const { adId } = req.params;
      const { title, description } = req.body;

      // Get existing ad
      const existingAd = await AdModel.getAdById(adId);
      if (!existingAd) {
        return res.status(404).json({ message: "Ad not found." });
      }

      // Update only the title and description
      existingAd.content.title = title;
      existingAd.content.description = description;
      existingAd.updatedAt = new Date().toISOString();

      // Save the updated ad
      await AdModel.saveAd(existingAd);

      res.json({ message: "Ad updated successfully.", ad: existingAd });
    } catch (error) {
      console.error("Error updating ad metadata:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = AdController;
