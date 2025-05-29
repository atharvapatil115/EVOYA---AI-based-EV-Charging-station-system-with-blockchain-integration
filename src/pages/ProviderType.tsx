// import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProviderTypePage = () => {
  const navigate = useNavigate();
  const { setProviderType } = useAuth();

  const handleProviderTypeSelection = (type) => {
    setProviderType(type);
    navigate(`/provider-info?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Select Provider Type</h1>
        <div className="space-y-4">
          <button
            onClick={() => handleProviderTypeSelection('home')}
            className="w-full bg-white hover:bg-green-50 text-left p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Home size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Home Charging Station</h2>
                <p className="text-gray-600 mt-1">Share your residential charging station</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleProviderTypeSelection('commercial')}
            className="w-full bg-white hover:bg-green-50 text-left p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Building size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Commercial Charging Station</h2>
                <p className="text-gray-600 mt-1">Register your business charging station</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderTypePage;