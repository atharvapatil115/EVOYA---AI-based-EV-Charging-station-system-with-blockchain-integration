import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';

// Define the form data interface
interface FormData {
  name: string;
  email: string;
  phone: string;
  evModel: string;
  batteryCapacity: string;
  homeCharging: boolean;
  preferredConnector: string;
  avgDailyDistance: string;
  password: string;
  confirmPassword: string;
  userType: 'ev_user' | 'provider';
}

const EVOwnerInfoPage = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    evModel: '',
    batteryCapacity: '',
    homeCharging: false,
    preferredConnector: 'Type 2',
    avgDailyDistance: '',
    password: '',
    confirmPassword: '',
    userType: 'ev_user',
  });

  const [showFirstModal, setShowFirstModal] = useState(false);
  const [showSecondModal, setShowSecondModal] = useState(false);
  const [error, setError] = useState<string | null>(null); // Allow string or null
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement; // Type assertion for checkbox

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.password || !formData.confirmPassword) {
      setError('Password and Confirm Password are required');
      return;
    }

    // Prepare payload without confirmPassword
    const { confirmPassword, ...payload } = formData;

    try {
      const response = await axios.post('http://localhost:5000/api/users', payload, {
        withCredentials: true, // Match backend's supports_credentials
      });
      console.log('Form submitted successfully:', response.data);
      setShowFirstModal(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>; // Type Axios error
      setError(axiosError.response?.data?.error || 'Registration failed');
    }
  };

  const handleNoClick = () => {
    console.log('Navigating to dashboard');
    navigate('/sign-in');
  };

  const handleYesClick = () => {
    setShowFirstModal(false);
    setShowSecondModal(true);
  };

  const handleStationTypeSelect = async (type: 'commercial' | 'home' | 'any' = 'any') => {
    setShowSecondModal(false);
    console.log(`Selected station type: ${type}`);

    try {
      // Prepare payload without confirmPassword
      const { confirmPassword, ...payload } = formData;
      const providerData = { ...payload, stationType: type, userType: 'provider' as const };
      const response = await axios.post('http://localhost:5000/api/stations', providerData, {
        withCredentials: true, // Match backend's supports_credentials
      });
      console.log('Provider registration submitted:', response.data);
      navigate(`/provider-info?type=${type}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>; // Type Axios error
      setError(axiosError.response?.data?.error || 'Provider registration failed');
    }
  };

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
                  <p className="text-sm text-gray-500">Do you want to register your charging station as well?</p>
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
                  <p className="text-sm text-gray-500">Please select your charging station type:</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
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
                <label htmlFor="evModel" className="block text-sm font-medium text-gray-700">
                  EV Model
                </label>
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
                <label htmlFor="batteryCapacity" className="block text-sm font-medium text-gray-700">
                  Battery Capacity (kWh)
                </label>
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
                <label htmlFor="avgDailyDistance" className="block text-sm font-medium text-gray-700">
                  Average Daily Distance (km)
                </label>
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
                <label htmlFor="preferredConnector" className="block text-sm font-medium text-gray-700">
                  Preferred Connector Type
                </label>
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

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
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
                  onClick={() => navigate('/sign-in')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showFirstModal && <FirstModal />}
      {showSecondModal && <SecondModal />}
    </div>
  );
};

export default EVOwnerInfoPage;