import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and app name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-500 mr-2" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">StudyPlanner</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <NavLink to="/" isActive={isActive('/')}>
              Dashboard
            </NavLink>
            <NavLink to="/schedule" isActive={isActive('/schedule')}>
              Schedule
            </NavLink>
            <NavLink to="/tasks" isActive={isActive('/tasks')}>
              Tasks
            </NavLink>
          </nav>

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-700" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, isActive, children }) => {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </Link>
  );
};

export default Header;