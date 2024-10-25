// aws-exports.js
const awsConfig = {
    Auth: {
      identityPoolId: 'your-identity-pool-id', // REQUIRED - Amazon Cognito Identity Pool ID
      region: 'your-region', // REQUIRED - Amazon Cognito Region
    },
    Storage: {
      AWSS3: {
        bucket: 'your-s3-bucket-name', // REQUIRED - Amazon S3 bucket name
        region: 'your-region', // REQUIRED - Amazon service region
      },
    },
  };
  
  export default awsConfig;