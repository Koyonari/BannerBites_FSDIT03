const express = require('express');
const cors = require('cors');
const { dynamoDb } = require('./awsMiddleware'); // Import dynamoDb from awsMiddleware
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner'); 
const { PutCommand, GetCommand, QueryCommand, DynamoDBClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DescribeTableCommand } = require("@aws-sdk/client-dynamodb");

// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Server configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with frontend's URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Debugging: Log the dynamoDb object to verify initialization
console.log('DynamoDB Document Client:', dynamoDb);
console.log('Has send method:', typeof dynamoDb.send === 'function');

const generatePresignedUrl = async (bucketName, key, contentType, expiresIn = 300) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  };
  const command = new PutObjectCommand(params);
  return await getSignedUrl(s3Client, command, { expiresIn });
};

// Generate a pre-signed URL for uploading media to S3
app.post('/generate-presigned-url', async (req, res) => {
  const { fileName, contentType } = req.body;

  // Determine the folder based on content type
  let folder;
  if (contentType.startsWith('image/')) {
    folder = 'images';
  } else if (contentType.startsWith('video/')) {
    folder = 'videos';
  } else {
    // Handle unsupported content types
    return res.status(400).json({ error: 'Unsupported content type' });
  }

  // Generate the S3 key with the appropriate folder
  const key = `${folder}/${Date.now()}-${fileName}`;

  try {
    const url = await generatePresignedUrl(process.env.S3_BUCKET_NAME, key, contentType, 300);
    res.json({ url, key });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save layout along with related grid items and scheduled ads
app.post('/api/saveLayout', async (req, res) => {
  console.log('Request to /api/saveLayout:', JSON.stringify(req.body, null, 2));

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
            gridItemId: `${layout.layoutId}#${item.index}`, // Partition key
            scheduledTime: scheduledAd.scheduledTime,       // Sort key (updated)
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

// Endpoint to get all layouts
app.get('/api/layouts', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
    };

    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);

    res.json(data.Items); // Return the array of layouts
  } catch (error) {
    console.error('Error fetching layouts:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get('/api/layouts/:layoutId', async (req, res) => {
  const { layoutId } = req.params;

  try {
    // Step 1: Get the layout details
    const layoutParams = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Key: {
        layoutId: layoutId,
      },
    };

    const layoutCommand = new GetCommand(layoutParams);
    const layoutData = await dynamoDb.send(layoutCommand);
    const layout = layoutData.Item;

    if (!layout) {
      return res.status(404).json({ message: 'Layout not found.' });
    }

    // Step 2: Get the grid items for this layout
    const gridItemsParams = {
      TableName: process.env.DYNAMODB_TABLE_GRIDITEMS,
      KeyConditionExpression: 'layoutId = :layoutId',
      ExpressionAttributeValues: {
        ':layoutId': layoutId,
      },
    };

    const gridItemsCommand = new QueryCommand(gridItemsParams);
    const gridItemsData = await dynamoDb.send(gridItemsCommand);
    const gridItems = gridItemsData.Items;

    // Step 3: For each grid item, get the scheduled ads
    for (const item of gridItems) {
      const scheduledAdsParams = {
        TableName: process.env.DYNAMODB_TABLE_SCHEDULEDADS,
        KeyConditionExpression: 'gridItemId = :gridItemId',
        ExpressionAttributeValues: {
          ':gridItemId': `${layoutId}#${item.index}`,
        },
      };

      const scheduledAdsCommand = new QueryCommand(scheduledAdsParams);
      const scheduledAdsData = await dynamoDb.send(scheduledAdsCommand);
      const scheduledAds = scheduledAdsData.Items;

      // Step 4: For each scheduled ad, get the ad details
      for (const scheduledAd of scheduledAds) {
        const adParams = {
          TableName: process.env.DYNAMODB_TABLE_ADS,
          Key: {
            adId: scheduledAd.adId,
          },
        };

        const adCommand = new GetCommand(adParams);
        const adData = await dynamoDb.send(adCommand);
        scheduledAd.ad = adData.Item; // Attach the ad details to the scheduledAd
      }

      item.scheduledAds = scheduledAds; // Attach the scheduled ads to the grid item
    }

    // Attach the grid items to the layout
    layout.gridItems = gridItems;

    // Return the complete layout data
    res.json(layout);
  } catch (error) {
    console.error('Error fetching layout data:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LOCATIONS,
    };

    const command = new ScanCommand(params);
    const data = await dynamoDb.send(command);
    res.json(data.Items); // Return list of locations
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Function to get the status of an index
const getIndexStatus = async (tableName, indexName) => {
  const params = {
    TableName: tableName,
  };
  const command = new DescribeTableCommand(params);
  const data = await dynamoDb.send(command);
  const index = data.Table.GlobalSecondaryIndexes.find(i => i.IndexName === indexName);
  return index ? index.IndexStatus : 'NOT_FOUND';
};

app.get('/api/locations/:locationId/tvs', async (req, res) => {
  const { locationId } = req.params;
  try {
    const indexStatus = await getIndexStatus(process.env.DYNAMODB_TABLE_TVS, 'locationId-index');

    if (indexStatus === 'ACTIVE') {
      // Use Query if index is ACTIVE
      const params = {
        TableName: process.env.DYNAMODB_TABLE_TVS,
        IndexName: 'locationId-index',
        KeyConditionExpression: 'locationId = :locationId',
        ExpressionAttributeValues: {
          ':locationId': locationId,
        },
      };
      const command = new QueryCommand(params);
      const data = await dynamoDb.send(command);
      res.json(data.Items);
    } else {
      // Use Scan if index is still being backfilled
      console.log('Index still backfilling, using Scan');
      const params = {
        TableName: process.env.DYNAMODB_TABLE_TVS,
        FilterExpression: 'locationId = :locationId',
        ExpressionAttributeValues: {
          ':locationId': locationId,
        },
      };
      const command = new ScanCommand(params);
      const data = await dynamoDb.send(command);
      res.json(data.Items);
    }
  } catch (error) {
    console.error('Error fetching TVs for location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Assign a layout to a TV
app.post('/api/tvs/:tvId/layouts', async (req, res) => {
  const { tvId } = req.params;
  const { layoutId, assignedDate } = req.body;

  if (!layoutId || !assignedDate) {
    return res.status(400).json({ message: 'LayoutId and assignedDate are required.' });
  }

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_TVLAYOUTS,
      Item: {
        tvId,
        layoutId,
        assignedDate,
      },
    };
    const command = new PutCommand(params);
    await dynamoDb.send(command);

    res.status(200).json({ message: 'Layout assigned to TV successfully.' });
  } catch (error) {
    console.error('Error assigning layout to TV:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
