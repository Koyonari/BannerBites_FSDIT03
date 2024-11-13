const { getAllLayouts } = require('../controllers/layoutController');
const LayoutModel = require('../models/LayoutModel');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

jest.mock('../models/LayoutModel');

describe('getAllLayouts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all layouts', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    const layouts = [{ layoutId: 'layout-1' }, { layoutId: 'layout-2' }];
    LayoutModel.getAllLayouts.mockResolvedValue(layouts);

    await getAllLayouts(req, res);

    expect(LayoutModel.getAllLayouts).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(layouts);
  });

  it('should handle errors when fetching layouts', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    LayoutModel.getAllLayouts.mockRejectedValue(new Error('Database error'));

    await getAllLayouts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
