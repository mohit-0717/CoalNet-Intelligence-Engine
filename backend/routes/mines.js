const express = require('express');
const router = express.Router();
const Mine = require('../models/Mine');

/**
 * GET /api/mines
 * Returns all active mines
 * Fixed to handle missing mines gracefully
 */
router.get('/', async (req, res) => {
  try {
    console.log('📊 Fetching all mines...');
    
    // Try to get mines from database
    let mines = await Mine.find({
      $or: [
        { status: 'active' },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
      ],
    })
      .select('name location state coordinates status')
      .sort({ name: 1 })
      .lean();

    // If no mines found, return empty array
    if (!mines || mines.length === 0) {
      console.warn('⚠️ No mines found in database');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No active mines found',
        count: 0
      });
    }

    console.log(`✅ Found ${mines.length} mines`);
    
    // Return successful response
    return res.status(200).json({
      success: true,
      data: mines,
      count: mines.length
    });
    
  } catch (err) {
    console.error('❌ Error fetching mines:', err.message);
    
    // Try fallback data
    console.log('⚠️ Using fallback mines data');
    const fallbackMines = [
      { name: 'Jharia, Dhanbad', location: 'Dhanbad', state: 'Jharkhand', coordinates: { lat: 23.75, lng: 86.42 }, status: 'active' },
      { name: 'Bokaro', location: 'Bokaro', state: 'Jharkhand', coordinates: { lat: 23.78, lng: 85.82 }, status: 'active' },
      { name: 'Jayanti', location: 'Jayanti', state: 'Jharkhand', coordinates: { lat: 23.7, lng: 86.6 }, status: 'active' },
      { name: 'Godda', location: 'Godda', state: 'Jharkhand', coordinates: { lat: 24.83, lng: 87.21 }, status: 'active' },
      { name: 'Giridih (Karbhari Coal Field)', location: 'Giridih', state: 'Jharkhand', coordinates: { lat: 24.18, lng: 86.3 }, status: 'active' },
      { name: 'Raniganj Coalfield', location: 'Raniganj', state: 'West Bengal', coordinates: { lat: 23.6, lng: 87.12 }, status: 'active' },
      { name: 'Korba', location: 'Korba', state: 'Chhattisgarh', coordinates: { lat: 22.35, lng: 82.68 }, status: 'active' },
      { name: 'Singrauli', location: 'Singrauli', state: 'Madhya Pradesh', coordinates: { lat: 24.2, lng: 82.67 }, status: 'active' },
    ];
    
    return res.status(200).json({
      success: true,
      data: fallbackMines,
      count: fallbackMines.length,
      warning: 'Using fallback data - database connection issue'
    });
  }
});

/**
 * GET /api/mines/:id
 * Returns a single mine by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mine = await Mine.findById(id).lean();
    
    if (!mine) {
      return res.status(404).json({
        success: false,
        error: 'Mine not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: mine
    });
  } catch (err) {
    console.error('❌ Error fetching mine:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch mine',
      message: err.message
    });
  }
});

module.exports = router;