// deleteLayout.test.js
const { deleteLayout } = require('../controllers/layoutController');
const { dynamoDb } = require('../middleware/awsClients');
const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../middleware/awsClients', () => ({
  dynamoDb: {
    send: jest.fn(),
  },
}));

// Mock other dependencies
jest.mock('../models/GridItemModel', () => ({
  getGridItemsByLayoutId: jest.fn(),
}));

jest.mock('../models/ScheduledAdModel', () => ({
  getScheduledAdsByLayoutId: jest.fn(),
  getScheduledAdsByAdId: jest.fn(),
}));

jest.mock('../models/AdModel', () => ({
  deleteAdById: jest.fn(),
}));

const GridItemModel = require('../models/GridItemModel');
const ScheduledAdModel = require('../models/ScheduledAdModel');
const AdModel = require('../models/AdModel');

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

    // Mock the related data retrieval
    GridItemModel.getGridItemsByLayoutId.mockResolvedValue([
      { layoutId: 'layout-123', index: 0 },
    ]);

    ScheduledAdModel.getScheduledAdsByLayoutId.mockResolvedValue([
      { gridItemId: 'layout-123#0', scheduledTime: '12:00', adId: 'ad-1' },
    ]);

    // Mock the DynamoDB send method
    dynamoDb.send.mockResolvedValue({});

    // Mock the AdModel methods
    ScheduledAdModel.getScheduledAdsByAdId.mockResolvedValue([]);
    AdModel.deleteAdById.mockResolvedValue({});

    await deleteLayout(req, res);

    expect(dynamoDb.send).toHaveBeenCalledWith(expect.any(TransactWriteCommand));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Layout layout-123 and its related items deleted successfully.',
    });
  });

  // Additional test cases...
});
