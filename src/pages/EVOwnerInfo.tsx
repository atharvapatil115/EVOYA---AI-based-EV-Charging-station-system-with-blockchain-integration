import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

const EVOwnerInfoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    evModel: '',
    batteryCapacity: '',
    homeCharging: false,
    preferredConnector: 'Type 2',
    avgDailyDistance: '',
  });
  
  const [showFirstModal, setShowFirstModal] = useState(false);
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [stationType, setStationType] = useState('');
  
  const navigate = useNavigate(); // Initialize useNavigate hook

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setShowFirstModal(true);
  };

  const handleNoClick = () => {
    console.log('Navigating to dashboard');
    navigate('/sign-in'); // Navigate to dashboard
  };

  const handleYesClick = () => {
    setShowFirstModal(false);
    setShowSecondModal(true);
  };

  const handleStationTypeSelect = (type = 'any') => {
    setStationType(type);
    setShowSecondModal(false);
    console.log(`Selected station type: ${type}`);
    
    // Navigate to provider registration form with station type as a query parameter
    navigate(`/provider-info?type=${type}`);
    
    // Alternatively, you can pass station type as state if you prefer:
    // navigate('/provider-registration', { state: { stationType: type } });
  };

  // First Modal - Ask if user wants to register charging station
  const FirstModal = () => (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle"></span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Register Your Charging Station</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Do you want to register your charging station as well?
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleYesClick}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={handleNoClick}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Second Modal - Choose station type
  const SecondModal = () => (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle"></span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Choose Station Type</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Please select your charging station type:
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={() => handleStationTypeSelect('commercial')}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Commercial Charging Station
            </button>
            <button
              type="button"
              onClick={() => handleStationTypeSelect('home')}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Home Charging Station
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">EV Owner Profile Setup</h1>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="evModel" className="block text-sm font-medium text-gray-700">EV Model</label>
                <input
                  type="text"
                  name="evModel"
                  id="evModel"
                  value={formData.evModel}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Tesla Model 3, Nissan Leaf"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="batteryCapacity" className="block text-sm font-medium text-gray-700">Battery Capacity (kWh)</label>
                <input
                  type="number"
                  name="batteryCapacity"
                  id="batteryCapacity"
                  value={formData.batteryCapacity}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="avgDailyDistance" className="block text-sm font-medium text-gray-700">Average Daily Distance (km)</label>
                <input
                  type="number"
                  name="avgDailyDistance"
                  id="avgDailyDistance"
                  value={formData.avgDailyDistance}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="preferredConnector" className="block text-sm font-medium text-gray-700">Preferred Connector Type</label>
                <select
                  name="preferredConnector"
                  id="preferredConnector"
                  value={formData.preferredConnector}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="CCS">CCS</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center mt-4">
              <input
                id="homeCharging"
                name="homeCharging"
                type="checkbox"
                checked={formData.homeCharging}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="homeCharging" className="ml-2 block text-sm text-gray-700">
                I have home charging capability
              </label>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showFirstModal && <FirstModal />}
      {showSecondModal && <SecondModal />}
    </div>
  );
};

export default EVOwnerInfoPage;