// getLayoutById.test.js
const { getLayoutById } = require('../controllers/layoutController');
const LayoutModel = require('../models/LayoutModel');
const GridItemModel = require('../models/GridItemModel');
const ScheduledAdModel = require('../models/ScheduledAdModel');
const AdModel = require('../models/AdModel');

jest.mock('../models/LayoutModel');
jest.mock('../models/GridItemModel');
jest.mock('../models/ScheduledAdModel');
jest.mock('../models/AdModel');

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
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    const layoutData = { layoutId: 'layout-123', name: 'Test Layout' };
    const gridItems = [
      {
        layoutId: 'layout-123',
        index: 0,
        scheduledAds: [
          {
            adId: 'ad-1',
            ad: { adId: 'ad-1', type: 'text', content: { text: 'Sample Ad' } },
          },
        ],
      },
    ];
    const adData = { adId: 'ad-1', type: 'text', content: { text: 'Sample Ad' } };

    // Mock model methods
    LayoutModel.getLayoutById.mockResolvedValue(layoutData);
    GridItemModel.getGridItemsByLayoutId.mockResolvedValue(gridItems);
    ScheduledAdModel.getScheduledAdsByGridItemId.mockResolvedValue(gridItems[0].scheduledAds);
    AdModel.getAdById.mockResolvedValue(adData);

    await getLayoutById(req, res);

    expect(LayoutModel.getLayoutById).toHaveBeenCalledWith('layout-123');
    expect(GridItemModel.getGridItemsByLayoutId).toHaveBeenCalledWith('layout-123');
    expect(ScheduledAdModel.getScheduledAdsByGridItemId).toHaveBeenCalledWith('layout-123#0');
    expect(AdModel.getAdById).toHaveBeenCalledWith('ad-1');
    expect(res.json).toHaveBeenCalledWith({
      ...layoutData,
      gridItems: [
        {
          ...gridItems[0],
          scheduledAds: [
            {
              adId: 'ad-1',
              ad: adData,
            },
          ],
        },
      ],
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 404 when layout is not found', async () => {
    const req = {
      params: {
        layoutId: 'layout-123',
      },
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    LayoutModel.getLayoutById.mockResolvedValue(null);

    await getLayoutById(req, res);

    expect(LayoutModel.getLayoutById).toHaveBeenCalledWith('layout-123');
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
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    LayoutModel.getLayoutById.mockRejectedValue(new Error('Database error'));

    await getLayoutById(req, res);

    expect(LayoutModel.getLayoutById).toHaveBeenCalledWith('layout-123');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
  });
});
