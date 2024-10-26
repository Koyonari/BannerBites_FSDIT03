// index.js
const express = require('express');
const cors = require('cors');
const { dynamoDb, s3 } = require('./awsMiddleware'); // Import dynamoDb and s3 from awsMiddleware
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Using express.json() instead of body-parser

// Debugging: Log the dynamoDb object to verify initialization
console.log('DynamoDB Document Client:', dynamoDb);
console.log('Has send method:', typeof dynamoDb.send === 'function');

// Endpoint to generate a presigned URL for uploading media to S3
app.get('/api/uploadMediaUrl', async (req, res) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'Missing required query parameters.' });
    }

    // Generate a unique file key for S3 storage
    const fileKey = `media/${uuidv4()}-${fileName}`;

    // Define the S3 parameters for uploading
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      ACL: 'public-read', // Set ACL to make the object publicly readable
    };

    // Generate a presigned URL using the PutObjectCommand
    const command = new PutObjectCommand(params);
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Return the presigned URL and file key to the client
    return res.status(200).json({ uploadURL, fileKey });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Endpoint to save layout along with related grid items and scheduled ads
app.post('/api/saveLayout', async (req, res) => {
  try {
    const layout = req.body;

    // Validate layout data
    if (!layout || !layout.layoutId) {
      console.error('Invalid layout data received:', layout);
      return res.status(400).json({ message: 'Invalid layout data.' });
    }

    // Step 1: Save layout details to the Layouts table
    const layoutParams = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Item: {
        layoutId: layout.layoutId,
        name: layout.name || 'Unnamed Layout',
        rows: layout.rows,
        columns: layout.columns,
        createdAt: new Date().toISOString(),
      },
    };
    const layoutCommand = new PutCommand(layoutParams);
    await dynamoDb.send(layoutCommand);
    console.log(`Layout ${layout.layoutId} saved successfully.`);

    // Track unique ads to avoid duplicate entries in the Ads table
    const uniqueAds = new Set();

    // Step 2: Save each grid item and its associated scheduled ads
    for (const item of layout.gridItems) {
      // Save each grid item in the GridItems table
      const gridItemParams = {
        TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
        Item: {
          layoutId: layout.layoutId, // Partition key
          index: item.index, // Sort key
          row: item.row,
          column: item.column,
          isMerged: item.isMerged,
          rowSpan: item.rowSpan,
          colSpan: item.colSpan,
        },
      };
      const gridItemCommand = new PutCommand(gridItemParams);
      await dynamoDb.send(gridItemCommand);
      console.log(`Grid item at index ${item.index} for layout ${layout.layoutId} saved successfully.`);

      // Step 3: Save each scheduled ad for the grid item
      for (const scheduledAd of item.scheduledAds) {
        const scheduledAdParams = {
          TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
          Item: {
            gridItemId: `${layout.layoutId}#${item.index}`, // Composite key
            scheduledDateTime: scheduledAd.scheduledDateTime, // Sort key
            adId: scheduledAd.ad.id,
            index: item.index,
            layoutId: layout.layoutId,
          },
        };
        const scheduledAdCommand = new PutCommand(scheduledAdParams);
        await dynamoDb.send(scheduledAdCommand);
        console.log(`Scheduled ad ${scheduledAd.ad.id} for grid item ${item.index} saved successfully.`);

        // Step 4: Save unique ad details in the Ads table if not already saved
        if (!uniqueAds.has(scheduledAd.ad.id)) {
          const adParams = {
            TableName: process.env.DYNAMODB_TABLE_ADS,
            Item: {
              adId: scheduledAd.ad.id,
              type: scheduledAd.ad.type,
              content: scheduledAd.ad.content,
              styles: scheduledAd.ad.styles,
            },
          };
          const adCommand = new PutCommand(adParams);
          await dynamoDb.send(adCommand);
          console.log(`Ad ${scheduledAd.ad.id} saved successfully.`);
          uniqueAds.add(scheduledAd.ad.id); // Track this ad as saved
        }
      }
    }

    // Return success response after all operations are complete
    return res.status(200).json({ message: 'Layout and related items saved successfully.' });
  } catch (error) {
    console.error('Error saving layout and related items:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
