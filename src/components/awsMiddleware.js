// awsMiddleware.js
import AWS from 'aws-sdk';

// AWS SDK configuration middleware
const configureAWS = () => {
  AWS.config.update({
    region: process.env.REACT_APP_AWS_REGION,
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  });

  // Return the configured DynamoDB DocumentClient
  return new AWS.DynamoDB.DocumentClient();
};

// Export the configured DynamoDB client
const dynamoDb = configureAWS();

export default dynamoDb;
