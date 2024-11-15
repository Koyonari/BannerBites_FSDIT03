// routes/ads.js
const express = require('express');
const router = express.Router();
const AdModel = require('../models/AdModel');

// Endpoint to batch get ads by adIds
router.post('/batchGet', async (req, res) => {
  try {
    const { adIds } = req.body;

    if (!adIds || !Array.isArray(adIds)) {
      return res.status(400).json({ message: 'Invalid adIds provided.' });
    }

    const ads = await AdModel.getAdsByIds(adIds);
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads by adIds:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
