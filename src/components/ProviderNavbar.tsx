// src/components/ProviderNavbar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onSwitchToUser: () => void;
}

const ProviderNavbar: React.FC<NavbarProps> = ({ isDarkMode, setIsDarkMode, onSwitchToUser }) => {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const handleProfileClick = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleProfileOption = (option: string) => {
    if (option === 'profile') {
      alert('Opening provider profile');
    } else if (option === 'logout') {
      alert('Logging out');
    } else if (option === 'switch') {
      onSwitchToUser();
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
        <div className="text-xl font-bold">Provider Dashboard</div>
        <div className="flex items-center space-x-6">
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
                    onClick={() => handleProfileOption('switch')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    Switch to User
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

export default ProviderNavbar;