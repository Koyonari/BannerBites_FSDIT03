const { saveLayout } = require('../controllers/layoutController');
const { dynamoDb } = require('../middleware/awsClients');
const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

jest.mock('../middleware/awsClients', () => ({
  dynamoDb: {
    send: jest.fn(),
  },
}));

describe('saveLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save a valid layout and related items', async () => {
    const req = {
      body: {
        layoutId: 'layout-123',
        name: 'Test Layout',
        gridItems: [],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    dynamoDb.send.mockResolvedValue({});

    await saveLayout(req, res);

    expect(dynamoDb.send).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Layout and related items saved successfully.',
    });
  });

  it('should return 400 if layout data is invalid', async () => {
    const req = {
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await saveLayout(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid layout data.' });
    expect(dynamoDb.send).not.toHaveBeenCalled();
  });

  it('should handle errors during DynamoDB transaction', async () => {
    const req = {
      body: {
        layoutId: 'layout-123',
        name: 'Test Layout',
        gridItems: [],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    dynamoDb.send.mockRejectedValue(new Error('DynamoDB error'));

    await saveLayout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
