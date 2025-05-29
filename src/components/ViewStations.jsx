import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, Zap, Clock, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const ViewStations = ({ stations, handleNavigate, isDarkMode }) => {
  // Format lastUpdated safely
  const formatLastUpdated = (lastUpdated) => {
    if (!lastUpdated || typeof lastUpdated !== 'string') return 'N/A';
    const parts = lastUpdated.split(' ');
    return parts.length > 1 ? parts[1] : lastUpdated;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {!Array.isArray(stations) || stations.length === 0 ? (
        <p className={`text-center text-sm col-span-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No stations found nearby.
        </p>
      ) : (
        stations.map((station, index) => (
          <motion.div
            key={station?.id || `station-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`rounded-lg border p-6 hover:shadow-md transition-shadow ${
              isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold text-lg">{station?.name || 'Unknown Station'}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <MapPin size={16} className="mr-1" />
                  {station?.location || 'Unknown Location'}
                </div>
              </div>
              <div className="flex flex-col justify-between items-end">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {station?.status || 'Unknown'}
                </span>
                <span className="text-sm font-medium mt-2">{station?.pricePerKWh || 'N/A'}</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Zap size={16} className="mr-1 text-yellow-500" />
                {station?.powerAvailable ? `${station.powerAvailable} kW` : 'N/A'}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1 text-blue-600" />
                Updated: {formatLastUpdated(station?.lastUpdated)}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500">
                Connectors: {Array.isArray(station?.connectorTypes) ? station.connectorTypes.join(', ') : 'N/A'}
              </p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => station && handleNavigate(station)}
                disabled={!station}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-white ${
                  station ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                } transition-colors`}
              >
                <Navigation size={16} className="mr-2" />
                Navigate
              </button>
              <button
                className={`flex-1 px-4 py-2 border rounded-md text-sm font-medium ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Book Now
              </button>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

ViewStations.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      location: PropTypes.string,
      status: PropTypes.string,
      pricePerKWh: PropTypes.string,
      powerAvailable: PropTypes.number,
      lastUpdated: PropTypes.string,
      connectorTypes: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  handleNavigate: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired
};

ViewStations.defaultProps = {
  stations: []
};

export default ViewStations;