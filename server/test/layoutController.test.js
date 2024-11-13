// layoutController.test.js
const { generatePresignedUrlController } = require('../controllers/layoutController');
const { generatePresignedUrl } = require('../services/s3Service');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

jest.mock('../services/s3Service');

describe('generatePresignedUrlController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a presigned URL for an image file', async () => {
    const req = {
      body: {
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    generatePresignedUrl.mockResolvedValue('https://s3.presigned.url');

    await generatePresignedUrlController(req, res);

    expect(generatePresignedUrl).toHaveBeenCalledWith(
      process.env.S3_BUCKET_NAME,
      expect.stringMatching(/^images\/\d+-test-image\.jpg$/),
      'image/jpeg',
      300
    );
    expect(res.json).toHaveBeenCalledWith({
      url: 'https://s3.presigned.url',
      key: expect.stringMatching(/^images\/\d+-test-image\.jpg$/),
    });
  });

  it('should return 400 for unsupported content type', async () => {
    const req = {
      body: {
        fileName: 'test-file.txt',
        contentType: 'text/plain',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await generatePresignedUrlController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported content type' });
    expect(generatePresignedUrl).not.toHaveBeenCalled();
  });

  it('should handle errors from generatePresignedUrl', async () => {
    const req = {
      body: {
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    generatePresignedUrl.mockRejectedValue(new Error('S3 error'));

    await generatePresignedUrlController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'S3 error' });
  });
});
