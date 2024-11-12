const { updateLayout } = require('../controllers/layoutController');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

describe('updateLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a valid layout and related items', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
      body: {
        layoutId: 'layout-123',
        name: 'Updated Layout',
        gridItems: [],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    dynamoDb.send.mockResolvedValue({});

    await updateLayout(req, res);

    expect(dynamoDb.send).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Layout and related items updated successfully.',
    });
  });

  it('should return 400 if layout data is invalid', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await updateLayout(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid layout data.' });
    expect(dynamoDb.send).not.toHaveBeenCalled();
  });

  it('should handle errors during DynamoDB transaction', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
      body: {
        layoutId: 'layout-123',
        name: 'Updated Layout',
        gridItems: [],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    dynamoDb.send.mockRejectedValue(new Error('DynamoDB error'));

    await updateLayout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
