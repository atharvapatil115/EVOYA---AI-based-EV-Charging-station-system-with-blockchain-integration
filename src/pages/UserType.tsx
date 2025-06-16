import { Zap, Battery } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserType = () => {
  const navigate = useNavigate();

  const handleEVUser = () => navigate('/ev-user-signup', { state: { userType: 'ev_user' } });
  const handleProvider = () => navigate('/provider-info', { state: { userType: 'provider' } });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Select User Type</h1>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleEVUser}
            className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <div className="flex items-center justify-center">
              <div className="mr-2">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">EV User</h2>
                <p className="text-sm">Sign up as an electric vehicle user</p>
              </div>
            </div>
          </button>
          <button
            onClick={handleProvider}
            className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <div className="flex items-center justify-center">
              <div className="mr-2">
                <Battery size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Provider</h2>
                <p className="text-sm">Sign up as a charging station provider</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserType;