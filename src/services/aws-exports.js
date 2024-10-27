// src/services/aws-exports.js
const awsConfig = {
    Storage: {
      AWSS3: {
        bucket: 'public-ads',
        region: 'ap-southeast-1',
      },
    },
  };
  
  export default awsConfig;
  