// updateLayout.test.js
const { updateLayout } = require('../controllers/layoutController');
const { dynamoDb } = require('../middleware/awsClients');
const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

jest.mock('../middleware/awsClients', () => ({
  dynamoDb: {
    send: jest.fn(),
  },
}));

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
});
