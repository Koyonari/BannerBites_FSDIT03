// scripts/cleanupOrphanedAds.js

// Load environment variables from .env file
require('dotenv').config();

const { ScanCommand, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamoDb } = require("./middleware/awsClients"); // Ensure this path is correct
const { v4: uuidv4 } = require('uuid'); // If needed for generating UUIDs

// Environment Variables
const DYNAMODB_TABLE_ADS = process.env.DYNAMODB_TABLE_ADS;
const DYNAMODB_TABLE_SCHEDULEDADS = process.env.DYNAMODB_TABLE_SCHEDULEDADS;
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to 'true' for dry run

// Maximum number of items per batch write (DynamoDB limit is 25)
const BATCH_SIZE = 25;

// Function to scan all items from a DynamoDB table handling pagination
const scanAll = async (params) => {
  let items = [];
  let lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const data = await dynamoDb.send(new ScanCommand(params));
      items = items.concat(data.Items);
      lastEvaluatedKey = data.LastEvaluatedKey;
    } catch (error) {
      console.error("Error scanning table:", error);
      throw error;
    }
  } while (lastEvaluatedKey);

  return items;
};

// Function to delete ads in batches with retry for unprocessed items
const deleteAdsInBatches = async (adIds) => {
  for (let i = 0; i < adIds.length; i += BATCH_SIZE) {
    const batch = adIds.slice(i, i + BATCH_SIZE);
    const deleteRequests = batch.map(adId => ({
      DeleteRequest: {
        Key: { adId },
      },
    }));

    const deleteParams = {
      RequestItems: {
        [DYNAMODB_TABLE_ADS]: deleteRequests,
      },
    };

    try {
      const deleteCommand = new BatchWriteCommand(deleteParams);
      const deleteResult = await dynamoDb.send(deleteCommand);

      // Handle unprocessed items
      if (deleteResult.UnprocessedItems && deleteResult.UnprocessedItems[DYNAMODB_TABLE_ADS] && deleteResult.UnprocessedItems[DYNAMODB_TABLE_ADS].length > 0) {
        console.warn(`Retrying ${deleteResult.UnprocessedItems[DYNAMODB_TABLE_ADS].length} unprocessed delete requests.`);
        // Implement a simple retry mechanism with exponential backoff
        await retryUnprocessedItems(deleteResult.UnprocessedItems[DYNAMODB_TABLE_ADS]);
      }

      console.log(`Deleted batch of ${batch.length} orphaned ads.`);
    } catch (error) {
      console.error("Error deleting ads in batch:", error);
      // Depending on requirements, you might want to continue or halt execution
      // Here, we'll halt to prevent inconsistent states
      throw error;
    }
  }
};

// Retry function for unprocessed items
const retryUnprocessedItems = async (unprocessedDeleteRequests, attempt = 1) => {
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY = 1000 * Math.pow(2, attempt); // Exponential backoff

  if (attempt > MAX_ATTEMPTS) {
    console.error("Max retry attempts reached. Some ads were not deleted.");
    return;
  }

  const retryParams = {
    RequestItems: {
      [DYNAMODB_TABLE_ADS]: unprocessedDeleteRequests,
    },
  };

  try {
    const retryCommand = new BatchWriteCommand(retryParams);
    const retryResult = await dynamoDb.send(retryCommand);

    if (retryResult.UnprocessedItems && retryResult.UnprocessedItems[DYNAMODB_TABLE_ADS] && retryResult.UnprocessedItems[DYNAMODB_TABLE_ADS].length > 0) {
      console.warn(`Retry attempt ${attempt} for ${retryResult.UnprocessedItems[DYNAMODB_TABLE_ADS].length} unprocessed delete requests.`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      await retryUnprocessedItems(retryResult.UnprocessedItems[DYNAMODB_TABLE_ADS], attempt + 1);
    } else {
      console.log(`All unprocessed items from attempt ${attempt} have been deleted successfully.`);
    }
  } catch (error) {
    console.error(`Error during retry attempt ${attempt}:`, error);
    throw error;
  }
};

// Main cleanup function
const cleanupOrphanedAds = async () => {
  try {
    console.log(`Starting cleanup of orphaned ads${DRY_RUN ? " (Dry Run)" : ""}...`);

    // Step 1: Get all adIds from Ads table
    const adsParams = {
      TableName: DYNAMODB_TABLE_ADS,
      ProjectionExpression: "adId",
    };
    const adsData = await scanAll(adsParams);
    const adsAdIds = adsData.map(item => item.adId);
    console.log(`Total Ads: ${adsAdIds.length}`);

    // Step 2: Get all adIds from ScheduledAds table
    const scheduledAdsParams = {
      TableName: DYNAMODB_TABLE_SCHEDULEDADS,
      ProjectionExpression: "adId",
    };
    const scheduledAdsData = await scanAll(scheduledAdsParams);
    const scheduledAdsAdIds = scheduledAdsData.map(item => item.adId);
    console.log(`Total Scheduled Ads: ${scheduledAdsAdIds.length}`);

    // Step 3: Identify orphaned adIds
    const scheduledAdsSet = new Set(scheduledAdsAdIds);
    const orphanedAdIds = adsAdIds.filter(adId => !scheduledAdsSet.has(adId));

    if (orphanedAdIds.length === 0) {
      console.log("No orphaned ads found.");
      return;
    }

    console.log(`Orphaned Ad IDs to delete (${orphanedAdIds.length}): ${orphanedAdIds.join(", ")}`);

    if (DRY_RUN) {
      console.log("Dry Run Enabled. No ads will be deleted.");
      return;
    }

    // Step 4: Delete orphaned ads in batches
    await deleteAdsInBatches(orphanedAdIds);

    console.log("Cleanup of orphaned ads completed successfully.");
  } catch (error) {
    console.error("Error during cleanup of orphaned ads:", error);
  }
};

// Execute the cleanup
cleanupOrphanedAds();
