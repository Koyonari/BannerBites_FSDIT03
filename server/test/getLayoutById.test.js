const { getLayoutById, fetchLayoutById } = require('../controllers/layoutController');
// At the top of your test file
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoDbMock = mockClient(DynamoDBClient);

// Reset mocks after each test
afterEach(() => {
  dynamoDbMock.reset();
});

jest.mock('../controllers/layoutController', () => {
  const originalModule = jest.requireActual('../controllers/layoutController');
  return {
    ...originalModule,
    fetchLayoutById: jest.fn(),
  };
});

describe('getLayoutById', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  
  it('should return layout data when layout is found', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    const layoutData = { layoutId: 'layout-123', name: 'Test Layout' };
    fetchLayoutById.mockResolvedValue(layoutData);
  
    await getLayoutById(req, res);
  
    expect(fetchLayoutById).toHaveBeenCalledWith('layout-123'); // This should pass
    expect(res.json).toHaveBeenCalledWith(layoutData);
  });

  it('should return 404 when layout is not found', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    fetchLayoutById.mockResolvedValue(null);

    await getLayoutById(req, res);

    expect(fetchLayoutById).toHaveBeenCalledWith('layout-123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Layout not found.' });
  });

  it('should handle errors during fetching layout data', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    fetchLayoutById.mockRejectedValue(new Error('Database error'));

    await getLayoutById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
