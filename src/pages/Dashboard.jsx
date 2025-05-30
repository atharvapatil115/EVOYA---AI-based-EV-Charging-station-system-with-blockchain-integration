import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import EVStatus from '../components/EVStatus';

// Remove default Leaflet icon styles
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Emoji-based markers using L.divIcon
const userIcon = new L.divIcon({
  html: '<span style="font-size: 24px; color: #ff0000;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const navigationIcon = new L.divIcon({
  html: '<span style="font-size: 24px; color: #0000ff;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const pinIcon = new L.divIcon({
  html: '<span style="font-size: 24px; color: #ff4500;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const availableIcon = new L.divIcon({
  html: '<span style="font-size: 24px; color: #32cd32;">🔰</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const unavailableIcon = new L.divIcon({
  html: '<span style="font-size: 24px; color: #ff0000;">⚠️</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// ViewStations component for displaying station cards
const ViewStations = ({ stations, handleNavigate, isDarkMode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {stations.map((station) => (
      <motion.div
        key={station.id}
        className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold">{station.name}</h3>
        <p className="text-sm">{station.location}</p>
        <p className="text-sm">Address: {station.address}</p>
        <p className="text-sm">Power: {station.powerAvailable} kW</p>
        <p className="text-sm">Price: {station.pricePerKWh}</p>
        {station.recommended && station.weatherSafe ? (
          <p className="text-sm text-green-500 font-medium">Recommended: Yes (Safe to travel)</p>
        ) : (
          <p className="text-sm text-red-500 font-medium">Likely unavailable, choose a different station</p>
        )}
        {station.weather && (
          <p className="text-sm mt-1">Weather: {station.weather.description} ({station.weather.temp}°C)</p>
        )}
        {station.arrivalTime && (
          <p className="text-sm mt-1">Est. Arrival: {station.arrivalTime}</p>
        )}
        <button
          onClick={() => handleNavigate(station)}
          className={`mt-2 px-4 py-2 rounded text-white transition-colors ${
            station.recommended && station.weatherSafe
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          disabled={!(station.recommended && station.weatherSafe)}
        >
          Navigate
        </button>
      </motion.div>
    ))}
  </div>
);

// MapClickHandler for dropping pins
const MapClickHandler = ({ setDroppedPin }) => {
  useMapEvents({
    click(e) {
      setDroppedPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// MapController for map resizing and bounds
const MapController = ({ navigating, userLocation, nearbyStations, centerAndFitBounds, droppedPin }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.invalidateSize();
      if (centerAndFitBounds && userLocation && nearbyStations.length > 0) {
        const bounds = L.latLngBounds([
          droppedPin ? [droppedPin.lat, droppedPin.lng] : [userLocation.lat, userLocation.lng],
          ...nearbyStations.map((station) => [station.lat, station.lng]),
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else if (droppedPin) {
        map.setView([droppedPin.lat, droppedPin.lng], 13);
      } else if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 13);
      }
    }
  }, [map, navigating, userLocation, nearbyStations, centerAndFitBounds, droppedPin]);

  return null;
};

// RoutingMachine for navigation routes
const RoutingMachine = ({ userLocation, destination }) => {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!userLocation || !destination || !map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      lineOptions: {
        styles: [{ color: '#16a34a', weight: 4 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      routeWhileDragging: true,
      showAlternatives: false,
      fitSelectedRoutes: true,
      addWaypoints: false,
    }).addTo(map);

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, userLocation, destination]);

  return null;
};

// MapLayers for map tile types
const MapLayers = ({ mapType }) => {
  const map = useMap();
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!map) return;

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).on('tileerror', () => setTileError(true));

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© <a href="https://www.esri.com/">Esri</a>, USGS, NOAA',
    }).on('tileerror', () => setTileError(true));

    const hybridLayer = L.layerGroup([
      satelliteLayer,
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© <a href="https://www.esri.com/">Esri</a>',
        opacity: 0.7,
      }).on('tileerror', () => setTileError(true)),
    ]);

    const layers = {
      street: streetLayer,
      satellite: satelliteLayer,
      hybrid: hybridLayer,
    };

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer || layer instanceof L.LayerGroup) {
        map.removeLayer(layer);
      }
    });

    layers[mapType].addTo(map);

    return () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer || layer instanceof L.LayerGroup) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, mapType]);

  return tileError ? (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80 z-[1000]">
      <p className="text-red-600 font-semibold">Failed to load map tiles. Check your internet connection.</p>
    </div>
  ) : null;
};

// Sample station data
const sampleStations = [
  {
    id: '1',
    name: 'Central EV Hub',
    location: 'Downtown, Mumbai',
    address: '123 Main St, Mumbai',
    powerAvailable: 75,
    lastUpdated: '2025-05-30 11:00',
    pricePerKWh: '₹15.50',
    connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
    status: 'Available',
    lat: 19.076,
    lng: 72.8777,
    totalSlots: 6,
    bookedSlots6AM_11AM: 4,
    bookedSlots11AM_4PM: 2,
    bookedSlots4PM_10PM: 1,
    recommended: true,
    weatherSafe: true,
    weather: { description: 'clear sky', temp: 28 },
  },
  {
    id: '2',
    name: 'Green Energy Station',
    location: 'Bandra, Mumbai',
    address: '456 Green Ave, Bandra, Mumbai',
    powerAvailable: 50,
    lastUpdated: '2025-05-30 11:05',
    pricePerKWh: '₹14.75',
    connectorTypes: ['CCS', 'Type 2'],
    status: 'Available',
    lat: 19.0596,
    lng: 72.8295,
    totalSlots: 6,
    bookedSlots6AM_11AM: 3,
    bookedSlots11AM_4PM: 5,
    bookedSlots4PM_10PM: 2,
    recommended: false,
    weatherSafe: true,
    weather: { description: 'light rain', temp: 27 },
  },
  {
    id: '3',
    name: 'Tech Park Chargers',
    location: 'Powai, Mumbai',
    address: '789 Tech Park Rd, Powai, Mumbai',
    powerAvailable: 100,
    lastUpdated: '2025-05-30 10:55',
    pricePerKWh: '₹16.00',
    connectorTypes: ['CCS', 'CHAdeMO', 'Type 2', 'Tesla'],
    status: 'Available',
    lat: 19.1176,
    lng: 72.906,
    totalSlots: 8,
    bookedSlots6AM_11AM: 6,
    bookedSlots11AM_4PM: 4,
    bookedSlots4PM_10PM: 3,
    recommended: true,
    weatherSafe: false,
    weather: { description: 'thunderstorm', temp: 26 },
  },
  {
    id: '4',
    name: 'Seaside Charging',
    location: 'Marine Drive, Mumbai',
    address: '321 Marine Dr, Mumbai',
    powerAvailable: 60,
    lastUpdated: '2025-05-30 10:50',
    pricePerKWh: '₹15.25',
    connectorTypes: ['CCS', 'Type 2'],
    status: 'Available',
    lat: 18.9442,
    lng: 72.8235,
    totalSlots: 5,
    bookedSlots6AM_11AM: 4,
    bookedSlots11AM_4PM: 3,
    bookedSlots4PM_10PM: 1,
    recommended: true,
    weatherSafe: true,
    weather: { description: 'partly cloudy', temp: 29 },
  },
  {
    id: '5',
    name: 'Highway Express Station',
    location: 'Navi Mumbai',
    address: '555 Eastern Express Hwy, Navi Mumbai',
    powerAvailable: 90,
    lastUpdated: '2025-05-30 11:00',
    pricePerKWh: '₹14.50',
    connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
    status: 'Available',
    lat: 19.033,
    lng: 73.0297,
    totalSlots: 7,
    bookedSlots6AM_11AM: 5,
    bookedSlots11AM_4PM: 2,
    bookedSlots4PM_10PM: 4,
    recommended: true,
    weatherSafe: true,
    weather: { description: 'clear sky', temp: 28 },
  },
];

const ReceiverDashboard = ({ stations = [] }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [nearbyStations, setNearbyStations] = useState(stations.length > 0 ? stations : sampleStations);
  const [mapType, setMapType] = useState('satellite');
  const [activeSection, setActiveSection] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [centerAndFitBounds, setCenterAndFitBounds] = useState(false);
  const [droppedPin, setDroppedPin] = useState(null);
  const watchIdRef = useRef(null);

  // Replace with your OpenWeatherMap API key
  const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Sign up at https://openweathermap.org/

  // Get user's initial location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ lat: 19.076, lng: 72.8777 }); // Default to Mumbai
        }
      );
    } else {
      setUserLocation({ lat: 19.076, lng: 72.8777 });
    }
  }, []);

  // Watch user's location during navigation
  useEffect(() => {
    if (navigating && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [navigating]);

  // Center map on user's current location
  const handleCenterOnUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setDroppedPin(null);
          setCenterAndFitBounds(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Ensure location services are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Clear dropped pin
  const handleClearPin = () => {
    setDroppedPin(null);
    setCenterAndFitBounds(false);
  };

  // Fetch weather data for a station
  const fetchWeather = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      const isSafe = !(
        (data.weather[0].id >= 200 && data.weather[0].id < 600) ||
        data.main.temp < 0 ||
        data.main.temp > 40 ||
        data.wind.speed * 3.6 > 50
      );
      return {
        safe: isSafe,
        description: data.weather[0].description,
        temp: Math.round(data.main.temp),
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return { safe: true, description: 'Unknown', temp: 0 };
    }
  };

  // Fetch nearby stations
  const fetchNearbyStations = async () => {
    const location = droppedPin || userLocation;
    if (!location) {
      alert('Location not available. Enable location services or drop a pin on the map.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/nearby-stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby stations');
      }

      let data = await response.json();
      data = await Promise.all(
        data.map(async (station) => {
          const weather = await fetchWeather(station.lat, station.lng);
          return { ...station, weatherSafe: weather.safe, weather: { description: weather.description, temp: weather.temp } };
        })
      );
      setNearbyStations(data);
      setSelectedStation(null);
      setNavigating(false);
      setCenterAndFitBounds(true);
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
      alert('Failed to fetch nearby stations. Showing default stations.');
      setNearbyStations(sampleStations);
      setCenterAndFitBounds(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch availability predictions
  const fetchAvailabilityPredictions = async () => {
    const location = droppedPin || userLocation;
    if (!location) {
      alert('Location not available. Enable location services or drop a pin on the map.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/availability-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability predictions');
      }

      let data = await response.json();
      data = await Promise.all(
        data.map(async (station) => {
          const weather = await fetchWeather(station.lat, station.lng);
          return { ...station, weatherSafe: weather.safe, weather: { description: weather.description, temp: weather.temp } };
        })
      );
      setNearbyStations(data);
      setSelectedStation(null);
      setNavigating(false);
      setCenterAndFitBounds(true);
    } catch (error) {
      console.error('Error fetching availability predictions:', error);
      alert('Failed to fetch availability predictions. Showing default stations.');
      setNearbyStations(sampleStations);
      setCenterAndFitBounds(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (station) => {
    setSelectedStation(station);
    setNavigating(true);
    setCenterAndFitBounds(false);
    setActiveSection('home');
  };

  const handleCancelNavigation = () => {
    setSelectedStation(null);
    setNavigating(false);
    setCenterAndFitBounds(false);
  };

  const handleMapTypeChange = (e) => {
    setMapType(e.target.value);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
      <Navbar
        setActiveSection={setActiveSection}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activeSection={activeSection}
      />

      <AnimatePresence mode="wait">
        {activeSection === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8 pt-20"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-lg shadow-md mb-8 text-white">
              <h1 className="text-2xl font-bold mb-2">{navigating ? 'Navigation Mode' : 'Welcome to EV Connect'}</h1>
              <p className="text-sm opacity-90">
                {navigating ? `Navigating to ${selectedStation?.name}` : 'Find and navigate to charging stations near you'}
              </p>
            </div>

            <div className="mb-6">
              <div className={`rounded-lg overflow-hidden shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-4 flex items-center">
                  <label htmlFor="mapType" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`}>
                    Map Type:
                  </label>
                  <select
                    id="mapType"
                    value={mapType}
                    onChange={handleMapTypeChange}
                    className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <option value="street">Street</option>
                    <option value="satellite">Satellite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className={`${navigating ? 'h-[600px]' : 'h-[450px]'} w-full relative transition-all duration-300`}>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
                      <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {userLocation ? (
                    <MapContainer
                      center={[userLocation.lat, userLocation.lng]}
                      zoom={13}
                      className="h-full w-full"
                      style={{ height: '100%', width: '100%' }}
                      whenReady={() => setMapReady(true)}
                    >
                      <MapLayers mapType={mapType} />
                      <MapController
                        navigating={navigating}
                        userLocation={userLocation}
                        nearbyStations={nearbyStations}
                        centerAndFitBounds={centerAndFitBounds}
                        droppedPin={droppedPin}
                      />
                      <MapClickHandler setDroppedPin={setDroppedPin} />
                      <Marker position={[userLocation.lat, userLocation.lng]} icon={navigating ? navigationIcon : userIcon}>
                        <Popup>
                          <strong>{navigating ? 'Navigating' : 'Your Location'}</strong>
                        </Popup>
                      </Marker>
                      {droppedPin && (
                        <Marker position={[droppedPin.lat, droppedPin.lng]} icon={pinIcon}>
                          <Popup>
                            <strong>Dropped Pin</strong>
                          </Popup>
                        </Marker>
                      )}
                      {nearbyStations.map((station) => (
                        <motion.div
                          key={station.id}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1, y: [0, -8] }}
                          transition={{
                            y: {
                              type: 'spring',
                              stiffness: 200,
                              damping: 20,
                              repeat: Infinity,
                              repeatType: 'reverse',
                              duration: 1.5,
                            },
                          }}
                        >
                          <Marker
                            position={[station.lat, station.lng]}
                            icon={station.recommended && station.weatherSafe ? availableIcon : unavailableIcon}
                          >
                            <Popup>
                              <div className="p-2 max-w-[200px]">
                                <h3 className="font-semibold text-sm">{station.name}</h3>
                                <p className="text-xs">{station.location}</p>
                                <p className="text-xs">Power: {station.powerAvailable} kW</p>
                                <p className="text-xs">Price: {station.pricePerKWh}</p>
                                <p className="text-xs">
                                  Status:{' '}
                                  <span className={station.recommended && station.weatherSafe ? 'text-green-600' : 'text-red-600'}>
                                    {station.recommended && station.weatherSafe ? 'Recommended' : 'Not Recommended'}
                                  </span>
                                </p>
                                {station.weather && (
                                  <p className="text-xs">Weather: {station.weather.description} ({station.weather.temp}°C)</p>
                                )}
                                {station.arrivalTime && (
                                  <p className="text-xs">Arrival: {station.arrivalTime}</p>
                                )}
                                <button
                                  onClick={() => handleNavigate(station)}
                                  className={`mt-2 px-2 py-1 text-xs rounded text-white ${
                                    station.recommended && station.weatherSafe
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : 'bg-gray-400 cursor-not-allowed'
                                  }`}
                                  disabled={!(station.recommended && station.weatherSafe)}
                                >
                                  Navigate
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        </motion.div>
                      ))}
                      {navigating && selectedStation && userLocation && mapReady && (
                        <RoutingMachine userLocation={userLocation} destination={selectedStation} />
                      )}
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200">
                      <p className="text-gray-600">Waiting for location access...</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
                    <motion.button
                      onClick={fetchNearbyStations}
                      className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Nearby Stations
                    </motion.button>
                    <motion.button
                      onClick={fetchAvailabilityPredictions}
                      className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Check Availability
                    </motion.button>
                  </div>
                  <div className="absolute bottom-4 left-4 z-[1000] flex space-x-2">
                    <motion.button
                      onClick={handleCenterOnUser}
                      className="p-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
                      title="Center on My Location"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={handleClearPin}
                      className="p-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none"
                      title="Clear Dropped Pin"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  {navigating && selectedStation && (
                    <div
                      className={`absolute bottom-4 left-0 right-0 mx-auto w-11/12 sm:w-3/4 md:w-1/2 p-4 rounded-lg shadow-lg z-[1000] border ${
                        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {selectedStation.name}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedStation.location}
                          </p>
                        </div>
                        <motion.button
                          onClick={handleCancelNavigation}
                          className={`px-3 py-1 rounded text-sm ${
                            isDarkMode
                              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                Nearby Charging Stations
              </h2>
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <ViewStations stations={nearbyStations} handleNavigate={handleNavigate} isDarkMode={isDarkMode} />
              )}
            </div>
          </motion.div>
        )}

        {activeSection === 'stations' && (
          <motion.div
            key="stations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8 pt-20"
          >
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              Nearby Charging Stations
            </h2>
            {isLoading ? (
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ViewStations stations={nearbyStations} handleNavigate={handleNavigate} isDarkMode={isDarkMode} />
            )}
          </motion.div>
        )}

        {activeSection === 'ev-status' && (
          <motion.div
            key="ev-status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8 pt-20"
          >
            <EVStatus isDarkMode={isDarkMode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceiverDashboard;