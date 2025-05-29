import { useNavigate } from 'react-router-dom'; 
import { Zap, Battery } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserTypePage = () => {
  const navigate = useNavigate();
  const { setUserType } = useAuth();

  const handleUserTypeSelection = (type:any) => {
    setUserType(type);
    
    if (type === 'provider') {
  navigate('/provider-type');
} else {
  navigate('/ev-owner-info');
}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Choose Your Account Type</h1>
        <div className="space-y-4">
          <button
            onClick={() => handleUserTypeSelection('provider')}
            className="w-full bg-white hover:bg-green-50 text-left p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Zap size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Charging Provider</h2>
                <p className="text-gray-600 mt-1">Offer your charging station to EV owners</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleUserTypeSelection('user')}
            className="w-full bg-white hover:bg-green-50 text-left p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Battery size={24} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">EV Owner</h2>
                <p className="text-gray-600 mt-1">Find and use available charging stations</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypePage;