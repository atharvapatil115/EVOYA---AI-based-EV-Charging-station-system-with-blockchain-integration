import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  openingTime: String,
  closingTime: String,
  chargingCapacity: String,
  stationType: String,
  location: {
    lat: Number,
    lng: Number,
  },
  description: String,
  stationName: String,
  connectorTypes: [String],
});

export default mongoose.model('Station', stationSchema);
