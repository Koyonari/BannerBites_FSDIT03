// services/s3Service.js
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../middleware/awsMiddleware");

const generatePresignedUrl = async (bucketName, key, contentType, expiresIn = 300) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  };
  const command = new PutObjectCommand(params);
  return await getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = { generatePresignedUrl };
