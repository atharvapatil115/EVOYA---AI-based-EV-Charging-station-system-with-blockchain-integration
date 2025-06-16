import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default marker icon in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  chargingCapacity: string;
  stationType: string;
  location: Location | null;
  description: string;
  stationName: string;
  connectorTypes: string[];
  password: string;
  confirmPassword: string;
  userType: string;
}

interface LocationMarkerProps {
  onLocationUpdate: (location: Location) => void;
}

interface LocationPickerProps {
  onLocationSelected: (location: Location) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ onLocationUpdate }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos: [number, number] = [latitude, longitude];
          setPosition(newPos);
          map.flyTo(newPos, 13);
          onLocationUpdate({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, [map, onLocationUpdate]);

  return position === null ? null : <Marker position={position} />;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelected({ lat, lng });
    },
  });

  return position === null ? null : <Marker position={position} />;
};

const ProviderInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingTime: '',
    closingTime: '',
    chargingCapacity: '',
    stationType: new URLSearchParams(window.location.search).get('stationType') || 'home',
    location: null,
    description: '',
    stationName: '',
    connectorTypes: [],
    password: '',
    confirmPassword: '',
    userType: 'provider',
  });
  const [error, setError] = useState<string | null>(null);
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([51.505, -0.09]);
  const [mapKey, setMapKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConnectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const connector = name.split('-')[1];
    setFormData((prev) => ({
      ...prev,
      connectorTypes: checked
        ? [...prev.connectorTypes, connector]
        : prev.connectorTypes.filter((type) => type !== connector),
    }));
  };

  const handleLocationSelected = (location: Location) => {
    setFormData((prev) => ({ ...prev, location }));
  };

  const handleUserLocationUpdate = (location: Location) => {
    if (!formData.location) {
      setFormData((prev) => ({ ...prev, location }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.password || !formData.confirmPassword) {
      setError('Password and Confirm Password are required');
      return;
    }
    if (!formData.location) {
      setError('Please select a location on the map.');
      return;
    }

    // Prepare payload without confirmPassword
    const { confirmPassword, ...payload } = formData;

    try {
      const response = await axios.post('http://localhost:5000/api/stations', payload, {
        withCredentials: true, // Match backend's supports_credentials
      });
      console.log('Form submitted successfully:', response.data);
      navigate('/Provider_Dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      setError(`Failed to save station data: ${errorMessage}`);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDefaultCenter([latitude, longitude]);
          setMapKey((prev) => prev + 1);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">
            {formData.stationType === 'home' ? 'Home Charging Station' : 'Commercial Charging Station'} Setup
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700">
                  Opening Time
                </label>
                <input
                  type="time"
                  name="openingTime"
                  id="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700">
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closingTime"
                  id="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="chargingCapacity" className="block text-sm font-medium text-gray-700">
                  Charging Capacity (kW)
                </label>
                <input
                  type="number"
                  name="chargingCapacity"
                  id="chargingCapacity"
                  value={formData.chargingCapacity}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {formData.stationType === 'commercial' && (
                <div>
                  <label htmlFor="stationName" className="block text-sm font-medium text-gray-700">
                    Station Name
                  </label>
                  <input
                    type="text"
                    name="stationName"
                    id="stationName"
                    value={formData.stationName}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Station Location</label>
              <div className="h-64 border border-gray-300 rounded-md overflow-hidden">
                <MapContainer
                  key={mapKey}
                  center={defaultCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker onLocationUpdate={handleUserLocationUpdate} />
                  <LocationPicker onLocationSelected={handleLocationSelected} />
                </MapContainer>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                The map shows your current location. Click anywhere on the map to set your charging station location.
                {formData.location && (
                  <span className="block mt-1">
                    Selected Location: Lat: {formData.location.lat.toFixed(6)}, Lng:{' '}
                    {formData.location.lng.toFixed(6)}
                  </span>
                )}
              </p>
            </div>

            {formData.stationType === 'commercial' && (
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                ></textarea>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Charging Connector Types</label>
              <div className="mt-2 space-y-2">
                {['Type 1', 'Type 2', 'CCS', 'CHAdeMO'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      id={`connector-${type}`}
                      name={`connector-${type}`}
                      type="checkbox"
                      checked={formData.connectorTypes.includes(type)}
                      onChange={handleConnectorChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`connector-${type}`} className="ml-2 block text-sm text-gray-700">
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/sign-in')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderInfoPage;
