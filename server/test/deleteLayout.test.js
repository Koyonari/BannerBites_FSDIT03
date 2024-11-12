const { deleteLayout } = require('../controllers/layoutController');
const GridItemModel = require('../models/GridItemModel');
const ScheduledAdModel = require('../models/ScheduledAdModel');
const AdModel = require('../models/AdModel');

jest.mock('../middleware/awsClients', () => ({
  dynamoDb: {
    send: jest.fn(),
  },
}));

jest.mock('../models/GridItemModel');
jest.mock('../models/ScheduledAdModel');
jest.mock('../models/AdModel');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

describe('deleteLayout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete layout and related items successfully', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    GridItemModel.getGridItemsByLayoutId.mockResolvedValue([
      { layoutId: 'layout-123', index: 0 },
    ]);
    ScheduledAdModel.getScheduledAdsByLayoutId.mockResolvedValue([
      { gridItemId: 'layout-123#0', scheduledTime: '00:00', adId: 'ad-1' },
    ]);
    ScheduledAdModel.getScheduledAdsByAdId.mockResolvedValue([]);
    AdModel.deleteAdById.mockResolvedValue({});

    dynamoDb.send.mockResolvedValue({});

    await deleteLayout(req, res);

    expect(dynamoDb.send).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Layout layout-123 and its related items deleted successfully.',
    });
  });

  it('should return 500 if an error occurs', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    GridItemModel.getGridItemsByLayoutId.mockRejectedValue(
      new Error('Database error')
    );

    await deleteLayout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
