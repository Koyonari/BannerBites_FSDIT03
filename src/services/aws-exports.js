// aws-exports.js
const awsConfig = {
    Auth: {
      identityPoolId: 'us-east-1:93bb0b4e-5322-4ff1-b0f7-f096063bb5b4', // REQUIRED - Amazon Cognito Identity Pool ID
      region: 'us-east-1', // REQUIRED - Amazon Cognito Region
    },
    Storage: {
      AWSS3: {
        bucket: 'ads-public', // Amazon S3 bucket name
        region: 'us-east-1', // Amazon service region
      },
    },
  };
  
  export default awsConfig;