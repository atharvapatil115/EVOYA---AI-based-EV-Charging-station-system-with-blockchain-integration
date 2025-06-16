import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Moon, Sun } from 'lucide-react';

// Define props interface
interface NavbarProps {
  setActiveSection: (section: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  activeSection: string;
}

const Navbar: React.FC<NavbarProps> = ({ setActiveSection, isDarkMode, setIsDarkMode, activeSection }) => {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleProfileOption = (option: string) => {
    if (option === 'profile') {
      alert('Opening user profile');
    } else if (option === 'logout') {
      alert('Logging out');
    }
    setIsProfileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[2000] shadow-md ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold">EV Connect</div>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveSection('home')}
            className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-900 transition-colors ${
              activeSection === 'home'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : isDarkMode
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSection('stations')}
            className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-900 transition-colors ${
              activeSection === 'stations'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : isDarkMode
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            View Stations
          </button>
          <button
            onClick={() => setActiveSection('ev-status')}
            className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 hover:text-gray-900 transition-colors ${
              activeSection === 'ev-status'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : isDarkMode
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            EV Status
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="User profile"
            >
              <User className="w-6 h-6" />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  <button
                    onClick={() => handleProfileOption('profile')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleProfileOption('logout')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;