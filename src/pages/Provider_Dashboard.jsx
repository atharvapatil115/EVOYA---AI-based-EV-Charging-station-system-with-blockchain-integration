import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import {
  Building,
  Zap,
  Users,
  BatteryCharging,
  ChevronRight,
  BarChart4
} from 'lucide-react';

const ProviderDashboard = () => {
  const location = useLocation();
  const formData = location.state;

  const [ownerInfo] = useState({
    name: 'Monika Mohite',
    email: 'monikamohite@gmail.com',
    phone: '+91 8329706248',
    company: 'EV Power Solutions',
    address: '123 Main Street, Mumbai, India'
  });



  const [stations, setStations] = useState([
    {
      id: '1',
      name: 'Central EV Hub',
      location: 'Downtown, Mumbai',
      status: 'Online',
      powerCapacity: 150,
      powerUsed: 75,
      revenue: '₹12,450',
      usersToday: 8,
      lastMaintenance: '2 days ago'
    },
    {
      id: '2',
      name: 'Green Energy Station',
      location: 'Bandra, Mumbai',
      status: 'Online',
      powerCapacity: 100,
      powerUsed: 50,
      revenue: '₹8,325',
      usersToday: 5,
      lastMaintenance: '1 week ago'
    },
    {
      id: '3',
      name: 'Tech Park Chargers',
      location: 'Powai, Mumbai',
      status: 'Maintenance',
      powerCapacity: 200,
      powerUsed: 0,
      revenue: '₹0',
      usersToday: 0,
      lastMaintenance: 'In progress'
    }
  ]);


//   useEffect(() => {
//   axios.get('http://localhost:5000/api/stations')
//     .then(res => setStations(res.data))
//     .catch(err => console.error('Fetch error:', err));
// }, []);


  const [bookings, setBookings] = useState([
    {
      id: 'B001',
      user: 'Raj Patel',
      station: 'Central EV Hub',
      startTime: '10:30 AM',
      duration: '45 min',
      status: 'Completed',
      revenue: '₹750'
    },
    {
      id: 'B002',
      user: 'Priya Singh',
      station: 'Green Energy Station',
      startTime: '11:45 AM',
      duration: '30 min',
      status: 'Completed',
      revenue: '₹500'
    },
    {
      id: 'B003',
      user: 'Amit Kumar',
      station: 'Central EV Hub',
      startTime: '01:15 PM',
      duration: '60 min',
      status: 'In Progress',
      revenue: '₹1000'
    },
    {
      id: 'B004',
      user: 'Neha Gupta',
      station: 'Green Energy Station',
      startTime: '03:00 PM',
      duration: '45 min',
      status: 'Upcoming',
      revenue: '-'
    }
  ]);

  const totalRevenue = stations.reduce((sum, station) => {
    const revenue = parseInt(station.revenue.replace(/[^\d]/g, ''));
    return sum + revenue;
  }, 0);

  const totalUsers = stations.reduce((sum, station) => sum + station.usersToday, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Offline': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Upcoming': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookingAction = (id, newStatus) => {
    setBookings(prev =>
      prev.map(booking =>
        booking.id === id ? { ...booking, status: newStatus } : booking
      )
    );
  };

  return (
    <>
      <div className="bg-gradient-to-r from-green-600 to-lime-600 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">Provider Dashboard</h2>
              <p className="text-green-100 text-sm mt-1">Manage your charging stations</p>
            </div>
            <div className="hidden sm:block">
              <button className="bg-white bg-opacity-20 text-white text-sm px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors">
                Add New Station
              </button>
            </div>
          </div>
        </div>
        <div className="bg-green-900 bg-opacity-20 px-6 py-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
            <InfoCard Icon={BatteryCharging} label="Total Stations" value={stations.length} />
            <InfoCard Icon={Zap} label="Power Delivered" value={`${stations.reduce((sum, s) => sum + s.powerUsed, 0)} kW`} />
            <InfoCard Icon={Users} label="Total Users Today" value={totalUsers} />
            <InfoCard Icon={BarChart4} label="Revenue Today" value={`₹${totalRevenue.toLocaleString()}`} />
          </div>
        </div>
      </div>

      <SectionHeader title="Owner's Information" />
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formData ? (
            <>
              <div><p className="text-sm text-gray-500">Name</p><p className="text-sm font-medium text-gray-900">{formData.name}</p></div>
              <div><p className="text-sm text-gray-500">Phone</p><p className="text-sm font-medium text-gray-900">{formData.phone}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="text-sm font-medium text-gray-900">{formData.email}</p></div>
              <div><p className="text-sm text-gray-500">Address</p><p className="text-sm font-medium text-gray-900">{formData.address}</p></div>
              <div><p className="text-sm text-gray-500">Opening Time</p><p className="text-sm font-medium text-gray-900">{formData.openingTime}</p></div>
              <div><p className="text-sm text-gray-500">Closing Time</p><p className="text-sm font-medium text-gray-900">{formData.closingTime}</p></div>
              <div><p className="text-sm text-gray-500">Charging Capacity</p><p className="text-sm font-medium text-gray-900">{formData.chargingCapacity} kW</p></div>
              <div><p className="text-sm text-gray-500">Connector Types</p><p className="text-sm font-medium text-gray-900">{formData.connectorTypes?.join(', ')}</p></div>
            </>
          ) : (
            Object.entries(ownerInfo).map(([key, value]) => (
              <div key={key}>
                <p className="text-sm text-gray-500 capitalize">{key}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <SectionHeader title="Current Bookings" />
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'User', 'Station', 'Time', 'Status', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.filter(b => b.status === 'Upcoming').map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.station}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.startTime} ({booking.duration})</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button onClick={() => handleBookingAction(booking.id, 'In Progress')} className="text-green-600 hover:text-green-800">Accept</button>
                  <button onClick={() => handleBookingAction(booking.id, 'Denied')} className="text-red-600 hover:text-red-800">Deny</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader title="Your Charging Stations" />
      <StationList stations={stations} getStatusColor={getStatusColor} />

      <SectionHeader title="Recent Bookings" />
      <BookingTable bookings={bookings} getStatusColor={getStatusColor} />
    </>
  );
};

const InfoCard = ({ Icon, label, value }) => (
  <div className="flex items-center">
    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white bg-opacity-20 flex items-center justify-center">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="ml-3">
      <p className="text-xs font-medium text-green-100">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-medium text-gray-900">{title}</h2>
    <button className="text-sm text-green-600 hover:text-green-800 hover:underline">View All</button>
  </div>
);

const StationList = ({ stations, getStatusColor }) => (
  <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
    <ul className="divide-y divide-gray-200">
      {stations.map((station) => (
        <li key={station.id} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">{station.name}</p>
                <p className="text-sm text-gray-500">{station.location}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                {station.status}
              </span>
              <ChevronRight className="ml-4 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StationStat icon={Zap} label={`Power: ${station.powerUsed}/${station.powerCapacity} kW`} percent={(station.powerUsed / station.powerCapacity) * 100} />
            <StationStat icon={Users} label={`Users Today: ${station.usersToday}`} />
            <StationStat icon={BarChart4} label={`Revenue: ${station.revenue}`} />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const StationStat = ({ icon: Icon, label, percent }) => (
  <div className="sm:col-span-1">
    <div className="flex items-center text-sm text-gray-500">
      <Icon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
      <span>{label}</span>
    </div>
    {percent !== undefined && (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
    )}
  </div>
);

const BookingTable = ({ bookings, getStatusColor }) => (
  <div className="flex flex-col">
    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Booking ID', 'User', 'Station', 'Time', 'Status', 'Revenue'].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.station}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.startTime} ({booking.duration})</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default ProviderDashboard;
