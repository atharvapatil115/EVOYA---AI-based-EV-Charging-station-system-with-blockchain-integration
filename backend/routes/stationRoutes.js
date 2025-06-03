import express from 'express';
import Station from '../models/Station.js';

const router = express.Router();

// POST - save form data
router.post('/', async (req, res) => {
  try {
    const station = new Station(req.body);
    await station.save();
    res.status(201).json(station);
  } catch (error) {
    console.error('❌ Save error:', error);
    res.status(500).json({ message: 'Failed to save station', error });
  }
});

// GET - fetch all stations (for dashboard)
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stations', error });
  }
});

export default router;
