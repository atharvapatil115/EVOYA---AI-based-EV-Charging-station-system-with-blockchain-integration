import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Building,
    Zap,
    Users,
    BatteryCharging,
    ChevronRight,
    BarChart4,
    RefreshCcw,
    X
} from 'lucide-react';
import { Web3 } from 'web3';
import { AnimatePresence, motion } from 'framer-motion';

// Define interfaces for data structures
interface OwnerInfo {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
}

interface Station {
    id: string;
    name: string;
    location: string;
    status: 'Online' | 'Maintenance' | 'Offline';
    powerCapacity: number;
    powerUsed: number;
    revenue: string;
    usersToday: number;
    lastMaintenance: string;
}

interface Booking {
    id: string;
    user: string;
    station: string;
    startTime: string;
    duration: string;
    status: 'Completed' | 'In Progress' | 'Upcoming' | 'Denied';
    revenue: string;
}

interface FormData {
    name: string;
    phone: string;
    email: string;
    address: string;
    openingTime: string;
    closingTime: string;
    chargingCapacity: number;
    connectorTypes: string[];
    [key: string]: any;
}

interface InfoCardProps {
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
}

interface SectionHeaderProps {
    title: string;
}

interface StationListProps {
    stations: Station[];
    getStatusColor: (status: string) => string;
}

interface StationStatProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    percent?: number;
}

interface BookingTableProps {
    bookings: Booking[];
    getStatusColor: (status: string) => string;
    onAction: (id: string, newStatus: Booking['status']) => void;
    showActions: boolean;
    onStartCharging: (bookingId: string) => void;
    currentChargingBookingId: string | null;
    isCharging: boolean;
    onStopCharging: () => void;
}

// Global variables for Web3 and contract
const contractAddress = "0xC70d7C5Eb2D6482B6bF95Bcc6417c803b63a4524"; // Replace with your contract address
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "startTimes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "startCharging",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stopCharging",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getChargingDuration",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
];
const ratePerSecond = 0.0001; // ETH/sec

const ProviderDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const formData = location.state as FormData | null;

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [isSwitching, setIsSwitching] = useState<boolean>(false);
    const [currentAccount, setCurrentAccount] = useState<string | null>(null);
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [chargingContract, setChargingContract] = useState<any | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isCharging, setIsCharging] = useState<boolean>(false);
    const [currentChargingBookingId, setCurrentChargingBookingId] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timerId, setTimerId] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    const [ownerInfo] = useState<OwnerInfo>({
        name: 'Monika Mohite',
        email: 'monikamohite@gmail.com',
        phone: '+91 8329706248',
        company: 'EV Power Solutions',
        address: '123 Main Street, Mumbai, India'
    });

    const [stations] = useState<Station[]>([
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

    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const initWeb3 = () => {
            try {
                if (window.ethereum) {
                    const web3Instance = new Web3(window.ethereum as any);
                    setWeb3(web3Instance);
                    const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
                    setChargingContract(contractInstance);
                } else if (window.Web3) {
                    const web3Instance = new window.Web3("http://localhost:8545");
                    setWeb3(web3Instance);
                    const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
                    setChargingContract(contractInstance);
                } else {
                    console.error("Web3 provider not found. Please install MetaMask or ensure Ganache is running.");
                }
            } catch (error) {
                console.error("Failed to initialize Web3 or contract:", error);
            }
        };

        initWeb3();
        fetchBookings();

        return () => {
            if (timerId !== null) clearInterval(timerId);
        };
    }, [timerId]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/provider-bookings`);
            if (response.data) {
                setBookings(response.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const totalRevenue = stations.reduce((sum, station) => {
        const revenue = parseInt(station.revenue.replace(/[^\d]/g, '')) || 0;
        return sum + revenue;
    }, 0);

    const totalUsers = stations.reduce((sum, station) => sum + station.usersToday, 0);

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'Online': return 'bg-green-100 text-green-800';
            case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
            case 'Offline': return 'bg-red-100 text-red-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Upcoming': return 'bg-gray-100 text-gray-800';
            case 'Denied': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleBookingAction = (id: string, newStatus: Booking['status']) => {
        setBookings(prev =>
            prev.map(booking =>
                booking.id === id ? { ...booking, status: newStatus } : booking
            )
        );
    };

    const handleSwitchToUser = () => {
        setIsSwitching(true);
        setTimeout(() => {
            setIsSwitching(false);
            navigate('/');
        }, 2000);
    };

    const startChargingOnChain = async (bookingId: string) => {
        if (!chargingContract || !currentAccount) {
            alert("Web3 or account not connected. Please connect your wallet.");
            return;
        }

        setIsCharging(true);
        setCurrentChargingBookingId(bookingId);

        try {
            await chargingContract.methods.startCharging().send({
                from: currentAccount,
                gas: 3000000
            });

            const currentStartTime = Date.now();
            setStartTime(currentStartTime);
            const newTimerId = window.setInterval(() => {
                const elapsed = Math.floor((Date.now() - currentStartTime) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
            setTimerId(newTimerId);

            console.log("Charging started on-chain.");
        } catch (error) {
            console.error("Failed to start charging on-chain:", error);
            setIsCharging(false);
            setCurrentChargingBookingId(null);
            setStartTime(null);
            if (timerId !== null) clearInterval(timerId);
            setTimerId(null);
            alert("Failed to start charging. See console for details.");
        }
    };

    const stopChargingOnChain = async () => {
        if (!isCharging || !chargingContract || !currentAccount || startTime === null || !web3) {
            alert("No charging session in progress.");
            return;
        }

        if (timerId !== null) clearInterval(timerId);
        
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const cost = web3.utils.toWei((duration * ratePerSecond).toFixed(6), 'ether');

        setIsCharging(false);

        try {
            await chargingContract.methods.stopCharging().send({
                from: currentAccount,
                value: cost,
                gas: 3000000
            });
            alert(`Paid ${web3.utils.fromWei(cost || '0')} ETH for ${duration} seconds.`);
        } catch (error) {
            console.error("Failed to stop charging on-chain:", error);
            alert("Failed to stop charging. See console for details.");
        } finally {
            setCurrentChargingBookingId(null);
            setStartTime(null);
            setTimerId(null);
            setElapsedTime(0);
        }
    };
    
    const connectMetaMask = async () => {
        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }

        if (isConnecting) {
            console.log('Connection request already pending...');
            return;
        }
        setIsConnecting(true);

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setCurrentAccount(accounts[0]);
            console.log("Connected to MetaMask:", accounts[0]);
        } catch (error) {
            console.error("MetaMask connection failed:", error);
            if ((error as any).code === -32002) {
                alert("MetaMask request already pending. Please open MetaMask.");
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const cost = (elapsedTime * ratePerSecond).toFixed(6);

    const chargingStatusUI = (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow rounded-lg p-6 my-8"
        >
            <h2 className="text-xl font-bold mb-4">EV Charging Status</h2>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Charging Status: <span id="status">{isCharging ? "Charging..." : "Stopped"}</span></h3>
                <button
                    onClick={stopChargingOnChain}
                    className={`btn btn-danger ${!isCharging && 'opacity-50 cursor-not-allowed'}`}
                    disabled={!isCharging}
                >
                    Stop Charging
                </button>
            </div>
            <p><strong>Elapsed Time:</strong> <span>{elapsedTime}</span> seconds</p>
            <p><strong>Cost per second:</strong> <span>{ratePerSecond}</span> ETH</p>
            <p><strong>Total Cost:</strong> <span>{cost}</span> ETH</p>
        </motion.div>
    );

    const dashboardUI = (
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
                            <div><p className="text-sm text-gray-500">Connector Types</p><p className="text-sm font-medium text-gray-900">{formData.connectorTypes?.join(', ') ?? 'N/A'}</p></div>
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
            
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Wallet Status</h2>
                <button
                    onClick={connectMetaMask}
                    className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
                    disabled={isConnecting || isCharging}
                >
                    <span className="mr-1">{currentAccount ? 'Connected' : 'Connect Wallet'}</span>
                    <Zap className="w-4 h-4" />
                </button>
            </div>
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Account:</p>
                    <p className="text-sm text-gray-500">{currentAccount || 'Not connected'}</p>
                </div>
                {isCharging && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                            <p>Status:</p>
                            <p>Charging</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                            <p>Elapsed Time:</p>
                            <p><span id="elapsedTime">{elapsedTime}</span>s</p>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-sm text-gray-500">
                            <p>Cost:</p>
                            <p><span id="cost">{(elapsedTime * ratePerSecond).toFixed(6)}</span> ETH</p>
                        </div>
                    </div>
                )}
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={stopChargingOnChain}
                        className={`bg-red-600 text-white text-sm px-4 py-2 rounded-md transition-colors ${!isCharging && 'bg-gray-400 cursor-not-allowed'}`}
                        disabled={!isCharging}
                    >
                        Stop Charging & Pay
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Current Bookings</h2>
                <button
                    onClick={fetchBookings}
                    className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4 mr-1"/>
                    Refresh
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <BookingTable
                    bookings={bookings.filter(b => b.status === 'Upcoming' || b.status === 'In Progress')}
                    getStatusColor={getStatusColor}
                    onAction={handleBookingAction}
                    onStartCharging={startChargingOnChain}
                    showActions={true}
                    currentChargingBookingId={currentChargingBookingId}
                    isCharging={isCharging}
                    onStopCharging={stopChargingOnChain}
                />
            </div>

            <SectionHeader title="Recent Bookings" />
            <BookingTable
                bookings={bookings.filter(b => b.status === 'Completed' || b.status === 'Denied')}
                getStatusColor={getStatusColor}
                onAction={handleBookingAction}
                showActions={false}
                onStartCharging={() => {}}
                currentChargingBookingId={null}
                isCharging={false}
                onStopCharging={() => {}}
            />
        </>
    );

    return (
        <div className="container mx-auto px-4 py-8 pt-20">
            <AnimatePresence>
                {isCharging && (
                    <motion.div
                        key="charging-status"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="bg-white shadow rounded-lg p-6 my-8"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">EV Charging Status</h2>
                            <button onClick={stopChargingOnChain} className="text-red-600 hover:text-red-800">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <p className="mb-2"><strong>Charging Status:</strong> <span className="text-green-600 font-semibold">{isCharging ? "Charging..." : "Stopped"}</span></p>
                        <p className="mb-2"><strong>Elapsed Time:</strong> <span>{elapsedTime}</span> seconds</p>
                        <p className="mb-2"><strong>Cost per second:</strong> <span>{ratePerSecond}</span> ETH</p>
                        <p className="mb-2"><strong>Total Cost:</strong> <span>{(elapsedTime * ratePerSecond).toFixed(6)}</span> ETH</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isCharging && dashboardUI}
        </div>
    );
};

// ... (other helper components remain the same) ...
const InfoCard: React.FC<InfoCardProps> = ({ Icon, label, value }) => (
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

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <button className="text-sm text-green-600 hover:text-green-800 hover:underline">View All</button>
    </div>
);

const StationList: React.FC<StationListProps> = ({ stations, getStatusColor }) => (
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

const StationStat: React.FC<StationStatProps> = ({ icon: Icon, label, percent }) => (
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

const BookingTable: React.FC<BookingTableProps> = ({ bookings, getStatusColor, onAction, showActions, onStartCharging, currentChargingBookingId, isCharging, onStopCharging }) => (
    <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Booking ID', 'User', 'Station', 'Time', 'Status'].map((heading) => (
                                    <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{heading}</th>
                                ))}
                                {showActions && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                )}
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
                                    {showActions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            {booking.status === 'Upcoming' && (
                                                <>
                                                    <button onClick={() => onAction(booking.id, 'In Progress')} className="text-green-600 hover:text-green-800">Accept</button>
                                                    <button onClick={() => onAction(booking.id, 'Denied')} className="text-red-600 hover:text-red-800">Deny</button>
                                                </>
                                            )}
                                            {booking.status === 'In Progress' && (
                                                <button
                                                    onClick={() => onStartCharging(booking.id)}
                                                    className={`bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors ${isCharging && currentChargingBookingId === booking.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                                                    disabled={isCharging && currentChargingBookingId !== booking.id}
                                                >
                                                    {isCharging && currentChargingBookingId === booking.id ? 'Charging...' : 'Start Charging'}
                                                </button>
                                            )}
                                        </td>
                                    )}
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