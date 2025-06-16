import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L, { LatLngExpression, DivIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import EVStatus from '../components/EVStatus';
import Navbar from '../components/Navbar';

// Define interfaces for TypeScript
interface Location {
  lat: number;
  lng: number;
}

interface Weather {
  description: string;
  temp: number;
}

interface Station {
  id: string;
  name: string;
  location: string;
  address: string;
  powerAvailable: number;
  lastUpdated: string;
  pricePerKWh: string;
  connectorTypes: string[];
  status: string;
  lat: number;
  lng: number;
  totalSlots: number;
  bookedSlots6AM_11AM: number;
  bookedSlots11AM_4PM: number;
  bookedSlots4PM_10PM: number;
  recommended: boolean;
  weatherSafe: boolean;
  weather?: Weather;
  arrivalTime?: string;
}

// Remove default Leaflet icon styles
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Emoji-based markers using L.divIcon
const userIcon = L.divIcon({
  html: '<span style="font-size: 24px; color: #ff0000;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
}) as DivIcon;

const navigationIcon = L.divIcon({
  html: '<span style="font-size: 24px; color: #0000ff;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
}) as DivIcon;

const pinIcon = L.divIcon({
  html: '<span style="font-size: 24px; color: #ff4500;">📍</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
}) as DivIcon;

const availableIcon = L.divIcon({
  html: '<span style="font-size: 24px; color: #32cd32;">🔰</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
}) as DivIcon;

const unavailableIcon = L.divIcon({
  html: '<span style="font-size: 24px; color: #ff0000;">⚠️</span>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
}) as DivIcon;

// ViewStations component
interface ViewStationsProps {
  stations: Station[];
  handleNavigate: (station: Station) => void;
  isDarkMode: boolean;
}

const ViewStations: React.FC<ViewStationsProps> = ({ stations, handleNavigate, isDarkMode }) => (
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
        <p className="text-sm">Connectors: {station.connectorTypes.join(', ') || 'None'}</p>
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

// MapClickHandler component
interface MapClickHandlerProps {
  setDroppedPin: (pin: Location | null) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ setDroppedPin }) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setDroppedPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// MapController component
interface MapControllerProps {
  navigating: boolean;
  userLocation: Location | null;
  nearbyStations: Station[];
  centerAndFitBounds: boolean;
  droppedPin: Location | null;
}

const MapController: React.FC<MapControllerProps> = ({ navigating, userLocation, nearbyStations, centerAndFitBounds, droppedPin }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.invalidateSize();
      if (centerAndFitBounds && userLocation && nearbyStations.length > 0) {
        const bounds = L.latLngBounds([
          droppedPin ? [droppedPin.lat, droppedPin.lng] : [userLocation.lat, userLocation.lng],
          ...nearbyStations.map((station) => [station.lat, station.lng] as LatLngExpression),
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

// RoutingMachine component
interface RoutingMachineProps {
  userLocation: Location | null;
  destination: Station | null;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({ userLocation, destination }) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

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

// MapLayers component
interface MapLayersProps {
  mapType: 'street' | 'satellite' | 'hybrid';
}

const MapLayers: React.FC<MapLayersProps> = ({ mapType }) => {
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
const sampleStations: Station[] = [
  {
    id: '1',
    name: 'Central EV Hub',
    location: 'Downtown, Mumbai',
    address: '123 Main St, Mumbai',
    powerAvailable: 75,
    lastUpdated: '2025-06-16T12:00:00Z',
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
];

interface ReceiverDashboardProps {
  stations?: Station[];
}

const ReceiverDashboard: React.FC<ReceiverDashboardProps> = ({ stations = [] }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [navigating, setNavigating] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [nearbyStations, setNearbyStations] = useState<Station[]>(stations.length > 0 ? stations : sampleStations);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [centerAndFitBounds, setCenterAndFitBounds] = useState<boolean>(false);
  const [droppedPin, setDroppedPin] = useState<Location | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Replace with your OpenWeatherMap API key
  const WEATHER_API_KEY = '927f530bb8f0a4a991cca33609d6f095';

  // Get user's initial location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
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
        (position: GeolocationPosition) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
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
        (position: GeolocationPosition) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setDroppedPin(null);
          setCenterAndFitBounds(false);
        },
        (error: GeolocationPositionError) => {
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
  const fetchWeather = async (lat: number, lng: number): Promise<{ safe: boolean; description: string; temp: number }> => {
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

  // Fetch recommendation for a station using /api/test_prediction
  const fetchStationRecommendation = async (station: Station): Promise<boolean> => {
    try {
      const now = new Date();
      const hour = now.getHours();
      let timeSlot: string;
      if (6 <= hour && hour < 11) {
        timeSlot = '6AM-11AM';
      } else if (11 <= hour && hour < 16) {
        timeSlot = '11AM-4PM';
      } else if (16 <= hour && hour < 22) {
        timeSlot = '4PM-10PM';
      } else {
        timeSlot = '11AM-4PM'; // Default
      }

      const bookedSlots = {
        '6AM-11AM': station.bookedSlots6AM_11AM,
        '11AM-4PM': station.bookedSlots11AM_4PM,
        '4PM-10PM': station.bookedSlots4PM_10PM,
      }[timeSlot] || 0;

      const response = await fetch('http://localhost:5000/api/test_prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_slots: station.totalSlots,
          booked_slots: bookedSlots,
          time_slot: timeSlot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      console.log(`Recommendation for ${station.name}:`, data.recommended);
      return data.recommended;
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      return false; // Fallback to false
    }
  };

  // Fetch availability predictions
  const fetchAvailabilityPredictions = async () => {
    const location = droppedPin || userLocation;
    if (!location) {
      console.warn('No location available');
      alert('Location not available. Enable location services or drop a pin on the map.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching availability predictions for:', { lat: location.lat, lng: location.lng });
      const response = await fetch('http://localhost:5000/api/availability-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch availability predictions: ${response.status} ${errorText}`);
      }

      const data: Station[] = await response.json();
      console.log('Availability predictions response:', data);
      if (!Array.isArray(data)) {
        console.warn('Received non-array response:', data);
        throw new Error('Invalid response format: expected an array');
      }
      if (data.length === 0) {
        console.warn('No stations returned from /api/availability-prediction');
        alert('No charging stations found for this location. Showing default stations.');
        setNearbyStations(sampleStations);
        setCenterAndFitBounds(true);
        return;
      }

      const updatedStations = await Promise.all(
        data.map(async (station: Station) => {
          console.log('Processing station:', station.name);
          const weather = await fetchWeather(station.lat, station.lng);
          const recommended = await fetchStationRecommendation(station);
          return {
            ...station,
            weatherSafe: weather.safe,
            weather: { description: weather.description, temp: weather.temp },
            recommended,
            connectorTypes: station.connectorTypes || [],
          };
        })
      );
      console.log('Updated stations:', updatedStations);
      setNearbyStations(updatedStations);
      setSelectedStation(null);
      setNavigating(false);
      setCenterAndFitBounds(true);
    } catch (error: any) {
      console.error('Error fetching availability predictions:', error.message, error.stack);
      alert(`Failed to fetch availability predictions: ${error.message}. Showing default stations.`);
      setNearbyStations(sampleStations);
      setCenterAndFitBounds(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (station: Station) => {
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

  const handleMapTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMapType(e.target.value as 'street' | 'satellite' | 'hybrid');
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
                      center={[userLocation.lat, userLocation.lng] as LatLngExpression}
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
                      <Marker position={[userLocation.lat, userLocation.lng] as LatLngExpression} icon={navigating ? navigationIcon : userIcon}>
                        <Popup>
                          <strong>{navigating ? 'Navigating' : 'Your Location'}</strong>
                        </Popup>
                      </Marker>
                      {droppedPin && (
                        <Marker position={[droppedPin.lat, droppedPin.lng] as LatLngExpression} icon={pinIcon}>
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
                            position={[station.lat, station.lng] as LatLngExpression}
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