import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// Define props interface
interface EVStatusProps {
  isDarkMode: boolean;
}

// Define EV data interface
interface EV {
  name: string;
  batteryStatus: string;
  owner: string;
  ownerContact: string;
  kmDriven: string;
}

const EVStatus: React.FC<EVStatusProps> = ({ isDarkMode }) => {
  const ev: EV = {
    name: 'Tesla Model 3',
    batteryStatus: '85%',
    owner: 'Sarvadnya Mense',
    ownerContact: '+91 9876543210',
    kmDriven: '45,230 km',
  };

  const handleReportFailure = () => {
    alert(`Reporting EV failure for ${ev.name}. Help has been notified at ${ev.ownerContact}.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg shadow-md p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
    >
      <h2 className="text-2xl font-bold mb-6">EV Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <img
            src="/tesla2.png"
            alt={ev.name}
            className="w-full h-64 object-cover rounded-lg"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
            }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4">{ev.name}</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Battery Status:</span> {ev.batteryStatus}
            </p>
            <p className="text-sm">
              <span className="font-medium">Owner:</span> {ev.owner}
            </p>
            <p className="text-sm">
              <span className="font-medium">Contact:</span> {ev.ownerContact}
            </p>
            <p className="text-sm">
              <span className="font-medium">Kilometers Driven:</span> {ev.kmDriven}
            </p>
          </div>
          <button
            onClick={handleReportFailure}
            className="mt-6 flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <AlertTriangle size={16} className="mr-2" />
            Report EV Failure
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EVStatus;