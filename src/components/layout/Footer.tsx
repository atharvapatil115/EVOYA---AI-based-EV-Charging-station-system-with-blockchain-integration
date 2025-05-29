import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {currentYear} StudyPlanner. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>for productive studying</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;