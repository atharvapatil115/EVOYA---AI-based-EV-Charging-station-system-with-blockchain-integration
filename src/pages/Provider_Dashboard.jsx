import { useState } from 'react';
import { Home, Building, Clock, Shield, Zap, Users, BatteryCharging, ChevronRight, BarChart4 } from 'lucide-react';

const ProviderDashboard = () => {
  const [stations] = useState([
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

  const [bookings] = useState([
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

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">Provider Dashboard</h2>
              <p className="text-indigo-100 text-sm mt-1">Manage your charging stations</p>
            </div>
            <div className="hidden sm:block">
              <button className="bg-white bg-opacity-20 text-white text-sm px-4 py-2 rounded-md hover:bg-opacity-30 transition-colors">
                Add New Station
              </button>
            </div>
          </div>
        </div>
        <div className="bg-indigo-900 bg-opacity-20 px-6 py-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white bg-opacity-20 flex items-center justify-center">
                <BatteryCharging className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-indigo-100">Total Stations</p>
                <p className="text-xl font-semibold">{stations.length}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white bg-opacity-20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-indigo-100">Power Delivered</p>
                <p className="text-xl font-semibold">{stations.reduce((sum, s) => sum + s.powerUsed, 0)} kW</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white bg-opacity-20 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-indigo-100">Total Users Today</p>
                <p className="text-xl font-semibold">{totalUsers}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-white bg-opacity-20 flex items-center justify-center">
                <BarChart4 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-indigo-100">Revenue Today</p>
                <p className="text-xl font-semibold">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Your Charging Stations</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
            View All
          </button>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {stations.map((station) => (
              <li key={station.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Building className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600">{station.name}</p>
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
                    <div className="sm:col-span-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Zap className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Power: {station.powerUsed}/{station.powerCapacity} kW</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1.5">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${(station.powerUsed / station.powerCapacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Users Today: {station.usersToday}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <BarChart4 className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Revenue: {station.revenue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
            View All
          </button>
        </div>
      </div>
      
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Station
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.station}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.startTime} ({booking.duration})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderDashboard;