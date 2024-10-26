// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { dynamoDb, s3 } = require('./awsMiddleware'); // Import dynamoDb and s3 from awsMiddleware
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json({ limit: '10mb' })); // Adjust limit as needed

// Endpoint to generate pre-signed URL
app.get('/api/uploadMediaUrl', async (req, res) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'Missing required query parameters.' });
    }

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `media/${uuidv4()}-${fileName}`,
      Expires: 60, // URL expires in 60 seconds
      ContentType: fileType,
      ACL: 'public-read', // Adjust based on your requirements
    };

    const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);

    return res.status(200).json({ uploadURL, fileKey: s3Params.Key });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Endpoint to save layout
app.post('/api/saveLayout', async (req, res) => {
  try {
    const layout = req.body;

    // Log the received layout for debugging
    console.log('Received layout:', JSON.stringify(layout, null, 2));

    // Basic validation
    if (!layout || !layout.layoutId) {
      console.error('Invalid layout data received:', layout);
      return res.status(400).json({ message: 'Invalid layout data.' });
    }

    // Prepare parameters for DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE_LAYOUTS,
      Item: {
        layoutId: layout.layoutId,
        name: layout.name || 'Unnamed Layout',
        rows: layout.rows,
        columns: layout.columns,
        gridItems: layout.gridItems,
        createdAt: new Date().toISOString(),
      },
    };

    // Save to DynamoDB
    await dynamoDb.put(params).promise();

    console.log(`Layout ${layout.layoutId} saved successfully.`);

    return res.status(200).json({ message: 'Layout saved successfully.' });
  } catch (error) {
    console.error('Error saving layout:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
