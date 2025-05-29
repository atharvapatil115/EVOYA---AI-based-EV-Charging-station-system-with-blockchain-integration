const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Station Schema
const stationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
    chargingCapacity: { type: String, required: true },
    stationType: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    description: { type: String, default: '' },
    stationName: { type: String, default: '' },
    connectorTypes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Station = mongoose.model('Station', stationSchema);

// POST Endpoint
app.post('/api/stations', async (req, res) => {
    try {
        console.log('Received data:', req.body);
        const station = new Station(req.body);
        await station.save();
        console.log('Saved station:', station);
        res.status(201).json({ message: 'Station saved successfully', data: station });
    } catch (error) {
        console.error('Error saving station:', error);
        res.status(500).json({ message: 'Error saving station', error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));