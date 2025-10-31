import { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L, { LatLngExpression, DivIcon } from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3'; // <-- ADDED THIS IMPORT

// --- HELPER COMPONENTS (Previously in separate files) ---

// 1. TransitionLoader Component
const TransitionLoader = () => (
    <motion.div
        className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[9999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg font-semibold">Switching Dashboard...</p>
        </div>
    </motion.div>
);

// 2. Navbar Component
interface NavbarProps {
    setActiveSection: (section: string) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    activeSection: string;
    onSwitchToProvider: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ setActiveSection, isDarkMode, setIsDarkMode, activeSection, onSwitchToProvider }) => (
    <nav className={`fixed top-0 left-0 right-0 z-50 shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-green-500">EV Connect</h1>
            <div className="hidden md:flex items-center space-x-4">
                <button onClick={() => setActiveSection('home')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'home' ? 'text-green-500' : ''}`}>Home</button>
                <button onClick={() => setActiveSection('stations')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'stations' ? 'text-green-500' : ''}`}>Stations</button>
                <button onClick={() => setActiveSection('ev-status')} className={`px-3 py-2 rounded-md text-sm font-medium ${activeSection === 'ev-status' ? 'text-green-500' : ''}`}>EV Status</button>
                <button onClick={onSwitchToProvider} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white">Provider View</button>
            </div>
            <div className="flex items-center">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full focus:outline-none">
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
            </div>
        </div>
    </nav>
);

// 3. EVStatus Component
interface EVStatusProps {
    isDarkMode: boolean;
}
const EVStatus: React.FC<EVStatusProps> = ({ isDarkMode }) => (
    <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-2xl font-bold mb-4">EV Status</h2>
        <div className="space-y-4">
            <div>
                <p className="font-semibold">Battery Level:</p>
                <div className="w-full bg-gray-300 rounded-full h-4 mt-1">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-right text-sm">85%</p>
            </div>
            <div>
                <p className="font-semibold">Estimated Range:</p>
                <p>250 km</p>
            </div>
            <div>
                <p className="font-semibold">Charging Status:</p>
                <p className="text-red-500">Not Charging</p>
            </div>
        </div>
    </div>
);


// --- MAIN DASHBOARD COMPONENT ---


// Define interfaces for TypeScript
interface Location {
    lat: number;
    lng: number;
}

interface Weather {
    description: string;
    temp: number;
}

interface Station {
    id: string;
    name: string;
    location: string;
    address: string;
    powerAvailable: number;
    lastUpdated: string;
    pricePerKWh: string; // Keep this as string (e.g., "₹15.50") for UPI
    connectorTypes: string[];
    status: string;
    lat: number;
    lng: number;
    totalSlots: number;
    bookedSlots6AM_11AM: number;
    bookedSlots11AM_4PM: number;
    bookedSlots4PM_10PM: number;
    recommended: boolean;
    weatherSafe: boolean;
    weather?: Weather;
    arrivalTime?: string;
}

// Remove default Leaflet icon styles
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Emoji-based markers using L.divIcon
const userIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #ff0000;">📍</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

const navigationIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #0000ff;">📍</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

const pinIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #ff4500;">📍</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

const availableIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #32cd32;">🔰</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

const unavailableIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #ff0000;">⚠️</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

const defaultStationIcon = L.divIcon({
    html: '<span style="font-size: 24px; color: #ffa500;">⭐</span>',
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
}) as DivIcon;

// ViewStations component
interface ViewStationsProps {
    stations: Station[];
    handleNavigate: (station: Station) => void;
    handleBook: (station: Station) => void;
    isDarkMode: boolean;
}

const ViewStations: React.FC<ViewStationsProps> = ({ stations, handleNavigate, handleBook, isDarkMode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station) => (
            <motion.div
                key={station.id}
                className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h3 className="text-lg font-semibold">{station.name}</h3>
                <p className="text-sm">{station.location}</p>
                <p className="text-sm">Address: {station.address}</p>
                <p className="text-sm">Power: {station.powerAvailable} kW</p>
                <p className="text-sm">Price: {station.pricePerKWh}</p>
                <p className="text-sm">Connectors: {station.connectorTypes.join(', ') || 'None'}</p>
                {station.recommended && station.weatherSafe ? (
                    <p className="text-sm text-green-500 font-medium">Recommended: Yes (Safe to travel)</p>
                ) : (
                    <p className="text-sm text-red-500 font-medium">Likely unavailable, choose a different station</p>
                )}
                {station.weather && (
                    <p className="text-sm mt-1">Weather: {station.weather.description} ({station.weather.temp}°C)</p>
                )}
                {station.arrivalTime && (
                    <p className="text-sm mt-1">Est. Arrival: {station.arrivalTime}</p>
                )}
                <button
                    onClick={() => handleNavigate(station)}
                    className={`mt-2 px-4 py-2 rounded text-white transition-colors ${
                        station.recommended && station.weatherSafe
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!(station.recommended && station.weatherSafe)}
                >
                    Navigate
                </button>
                <button
                    onClick={() => handleBook(station)}
                    className={`mt-2 ml-2 px-4 py-2 rounded text-white transition-colors ${
                        station.recommended && station.weatherSafe
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!(station.recommended && station.weatherSafe)}
                >
                    Book Charging Station
                </button>
            </motion.div>
        ))}
    </div>
);

// MapClickHandler component
interface MapClickHandlerProps {
    setDroppedPin: (pin: Location | null) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ setDroppedPin }) => {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            setDroppedPin({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
};

// MapController component
interface MapControllerProps {
    navigating: boolean;
    userLocation: Location | null;
    nearbyStations: Station[];
    centerAndFitBounds: boolean;
    droppedPin: Location | null;
}

const MapController: React.FC<MapControllerProps> = ({ navigating, userLocation, nearbyStations, centerAndFitBounds, droppedPin }) => {
    const map = useMap();

    useEffect(() => {
        if (map) {
            map.invalidateSize();
            if (centerAndFitBounds && userLocation && nearbyStations.length > 0) {
                const bounds = L.latLngBounds([
                    droppedPin ? [droppedPin.lat, droppedPin.lng] : [userLocation.lat, userLocation.lng],
                    ...nearbyStations.map((station) => [station.lat, station.lng] as LatLngExpression),
                ]);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } else if (droppedPin) {
                map.setView([droppedPin.lat, droppedPin.lng], 13);
            } else if (userLocation) {
                map.setView([userLocation.lat, userLocation.lng], 13);
            }
        }
    }, [map, navigating, userLocation, nearbyStations, centerAndFitBounds, droppedPin]);

    return null;
};

// RoutingMachine component
interface RoutingMachineProps {
    userLocation: Location | null;
    destination: Station | null;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({ userLocation, destination }) => {
    const map = useMap();
    const routingControlRef = useRef<L.Routing.Control | null>(null);

    useEffect(() => {
        if (!userLocation || !destination || !map) return;

        if (routingControlRef.current) {
            map.removeControl(routingControlRef.current);
        }

        routingControlRef.current = L.Routing.control({
            waypoints: [
                L.latLng(userLocation.lat, userLocation.lng),
                L.latLng(destination.lat, destination.lng),
            ],
            lineOptions: {
                styles: [{ color: '#16a34a', weight: 4 }],
                extendToWaypoints: true,
                missingRouteTolerance: 0,
            },
            routeWhileDragging: true,
            showAlternatives: false,
            fitSelectedRoutes: true,
            addWaypoints: false,
        }).addTo(map);

        return () => {
            if (routingControlRef.current && map) {
                map.removeControl(routingControlRef.current);
            }
        };
    }, [map, userLocation, destination]);

    return null;
};

// MapLayers component
interface MapLayersProps {
    mapType: 'street' | 'satellite' | 'hybrid';
}

const MapLayers: React.FC<MapLayersProps> = ({ mapType }) => {
    const map = useMap();
    const [tileError, setTileError] = useState(false);

    useEffect(() => {
        if (!map) return;

        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).on('tileerror', () => setTileError(true));

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© <a href="https://www.esri.com/">Esri</a>, USGS, NOAA',
        }).on('tileerror', () => setTileError(true));

        const hybridLayer = L.layerGroup([
            satelliteLayer,
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© <a href="https://www.esri.com/">Esri</a>',
                opacity: 0.7,
            }).on('tileerror', () => setTileError(true)),
        ]);

        const layers = {
            street: streetLayer,
            satellite: satelliteLayer,
            hybrid: hybridLayer,
        };

        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer || layer instanceof L.LayerGroup) {
                map.removeLayer(layer);
            }
        });

        layers[mapType].addTo(map);

        return () => {
            map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer || layer instanceof L.LayerGroup) {
                    map.removeLayer(layer);
                }
            });
        };
    }, [map, mapType]);

    return tileError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-80 z-[1000]">
            <p className="text-red-600 font-semibold">Failed to load map tiles. Check your internet connection.</p>
        </div>
    ) : null;
};


// --- [UPDATED] ACTIVE CHARGING COMPONENT (WEB3 & UPI INTEGRATION) ---

const CHARGE_RATE_ETH_PER_SECOND = 0.0001;
const MOCK_CHARGE_RATE_KW = 7; // Mock 7kW power draw

interface ActiveChargingProps {
    isDarkMode: boolean;
    handleSessionEnd: () => void;
    station: Station; 
}

const ActiveCharging: React.FC<ActiveChargingProps> = ({ isDarkMode, handleSessionEnd, station }) => {
    // --- [1] SHARED STATE ---
    const [paymentMethod, setPaymentMethod] = useState<'web3' | 'upi' | null>(null);

    // --- [2] WEB3 / GANACHE STATE ---
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [account, setAccount] = useState<string>('');
    const [contract, setContract] = useState<any>(null);
    const [contractConfig, setContractConfig] = useState<{ abi: any[], address: string } | null>(null);
    const [configStatus, setConfigStatus] = useState<string>('Initializing Web3...');
    const [web3Status, setWeb3Status] = useState('Not Started');
    const [connectStatus, setConnectStatus] = useState('');
    const [isWeb3Charging, setIsWeb3Charging] = useState(false);
    const [web3StartTime, setWeb3StartTime] = useState(0);
    const [web3ElapsedTime, setWeb3ElapsedTime] = useState(0);
    const [web3Cost, setWeb3Cost] = useState(0);
    const web3TimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // --- [NEW] State for Energy and USD Price ---
    const [web3PowerConsumed, setWeb3PowerConsumed] = useState(0);
    const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null);

    // --- [3] UPI STATE ---
    const [isUpiCharging, setIsUpiCharging] = useState(false);
    const [upiStartTime, setUpiStartTime] = useState(0);
    const [upiElapsedTime, setUpiElapsedTime] = useState(0);
    const [upiCost, setUpiCost] = useState(0);
    const [upiPowerConsumed, setUpiPowerConsumed] = useState(0);
    const [showUpiQR, setShowUpiQR] = useState(false);
    const upiTimerRef = useRef<NodeJS.Timeout | null>(null);


    // --- [A] WEB3 EFFECTS & FUNCTIONS ---

    // [A.1] Initialize Web3 & Fetch ETH Price
    useEffect(() => {
        // Init Web3
        if ((window as any).ethereum) {
            const web3Instance = new Web3((window as any).ethereum);
            setWeb3(web3Instance);
            setConfigStatus('Loading contract details...');
        } else {
            setConfigStatus('Please install MetaMask!');
        }

        // [NEW] Fetch ETH to USD Price
        const fetchEthPrice = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                if (!response.ok) throw new Error('Failed to fetch ETH price');
                const data = await response.json();
                setEthToUsdRate(data.ethereum.usd);
                console.log('ETH Price Loaded:', data.ethereum.usd);
            } catch (error) {
                console.error('Error fetching ETH price:', error);
                setEthToUsdRate(null); // Handle error case
            }
        };
        
        fetchEthPrice();
    }, []);

    // [A.2] Load Contract ABI and Address from JSON
    useEffect(() => {
        // This filename MUST match your file in /public/build/contracts/
        const CONTRACT_JSON_NAME = 'EVCharging.json';

        const loadContractConfig = async () => {
            if (!web3) return; // Wait for web3
            
            setConfigStatus('Loading contract details...');
            try {
                const response = await fetch(`/build/contracts/${CONTRACT_JSON_NAME}`);
                if (!response.ok) {
                    throw new Error(`Could not find /build/contracts/${CONTRACT_JSON_NAME}. Did you move the 'build' folder to 'public'?`);
                }
                const data = await response.json();
                const networkId = await web3.eth.net.getId();
                const deployedNetwork = data.networks[networkId.toString()];
                
                if (!deployedNetwork || !deployedNetwork.address) {
                    throw new Error(`Contract not deployed to network ID ${networkId} (Ganache). Please deploy.`);
                }
                
                setContractConfig({ abi: data.abi, address: deployedNetwork.address });
                setConfigStatus('Contract loaded.');
                console.log('Contract ABI and address loaded successfully:', deployedNetwork.address);

            } catch (error: any) {
                console.error('Failed to load contract config:', error);
                setConfigStatus(`Error: ${error.message}`);
            }
        };
        
        loadContractConfig();
    }, [web3]);

    // [A.3] Web3 Charging Timer - [UPDATED]
    useEffect(() => {
        if (isWeb3Charging && web3StartTime > 0) {
            web3TimerRef.current = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const elapsed = now - web3StartTime;
                setWeb3ElapsedTime(elapsed);
                setWeb3Cost(elapsed * CHARGE_RATE_ETH_PER_SECOND);
                
                // [NEW] Calculate power
                const hours = elapsed / 3600;
                const powerKWh = MOCK_CHARGE_RATE_KW * hours;
                setWeb3PowerConsumed(powerKWh);
            }, 1000);
        } else {
            if (web3TimerRef.current) {
                clearInterval(web3TimerRef.current);
                web3TimerRef.current = null;
            }
        }
        return () => {
            if (web3TimerRef.current) {
                clearInterval(web3TimerRef.current);
            }
        };
    }, [isWeb3Charging, web3StartTime]);

    // [A.4] Connect Wallet
    const connectWallet = async () => {
        if (!web3) {
            setConnectStatus('Web3 not initialized.');
            return;
        }
        if (!contractConfig) {
            setConnectStatus(`Contract config not loaded. Status: ${configStatus}`);
            return; // This is where it's failing
        }
        
        try {
            const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            const userAccount = accounts[0];
            setAccount(userAccount);
            
            const contractInstance = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
            setContract(contractInstance);
            
            setConnectStatus(`Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            setConnectStatus('Failed to connect wallet.');
        }
    };

    // [A.5] Web3 Start Charging - [IMPROVED]
   // [A.5] Web3 Start Charging - [NEW GAS-LESS START]
    const handleWeb3Start = () => {
        if (!contract || !account) {
            setWeb3Status('Please connect wallet first.');
            return;
        }
        
        // Reset metrics
        setWeb3ElapsedTime(0);
        setWeb3Cost(0);
        setWeb3PowerConsumed(0);
        
        // Set start time and start the timer
        setWeb3StartTime(Math.floor(Date.now() / 1000));
        setIsWeb3Charging(true);
        setWeb3Status('Charging');
    };
    // [A.6] Web3 Stop Charging - [IMPROVED]
    // [A.6] Web3 Stop Charging - [NEW PAYMENT LOGIC]
    const handleWeb3Stop = async () => {
        if (!contract || !account || !web3) {
            setWeb3Status('Wallet or Web3 not initialized.');
            return;
        }
        
        // Stop the timer immediately
        setIsWeb3Charging(false);
        if (web3TimerRef.current) {
            clearInterval(web3TimerRef.current);
        }

        // Calculate final values
        const finalElapsed = Math.floor(Date.now() / 1000) - web3StartTime;
        const finalCostETH = finalElapsed * CHARGE_RATE_ETH_PER_SECOND;
        const finalPower = (finalElapsed / 3600) * MOCK_CHARGE_RATE_KW;

        // Set state so the UI updates with final values
        setWeb3ElapsedTime(finalElapsed);
        setWeb3Cost(finalCostETH);
        setWeb3PowerConsumed(finalPower);

        // --- CRITICAL STEP: Convert ETH cost to Wei ---
        const finalCostInWei = web3.utils.toWei(finalCostETH.toString(), 'ether');

        try {
            setWeb3Status('Finalizing... Please confirm payment in MetaMask.');
            
            // This transaction IS the payment.
            // We send 'finalCostInWei' as the 'value' (the payment).
            await contract.methods.stopCharging().send({ 
                from: account,
                value: finalCostInWei  // <-- THIS IS THE PAYMENT
            });
            
            const usdCost = ethToUsdRate ? (finalCostETH * ethToUsdRate).toFixed(2) : '??';
            setWeb3Status(`Payment Successful! Final Cost: ${finalCostETH.toFixed(6)} ETH ($${usdCost})`);
            setWeb3StartTime(0); // Reset start time
        
        } catch (error: any) {
            console.error('Error stopping charging:', error);
            if (error.message && error.message.includes('User denied transaction signature')) {
                setWeb3Status('Payment transaction rejected.');
                // Don't restart the timer, let them try to pay again
            } else {
                setWeb3Status('Error processing payment.');
            }
        }
    };


    // --- [B] UPI EFFECTS & FUNCTIONS ---

    // [B.1] UPI Charging Timer
    useEffect(() => {
        if (isUpiCharging && upiStartTime > 0) {
            upiTimerRef.current = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const elapsed = now - upiStartTime;
                setUpiElapsedTime(elapsed);

                // Calculate cost and power
                const pricePerKWh = parseFloat(station.pricePerKWh.replace('₹', ''));
                const hours = elapsed / 3600;
                const powerKWh = MOCK_CHARGE_RATE_KW * hours;
                const cost = powerKWh * pricePerKWh;

                setUpiPowerConsumed(powerKWh);
                setUpiCost(cost);
            }, 1000);
        } else {
            if (upiTimerRef.current) {
                clearInterval(upiTimerRef.current);
                upiTimerRef.current = null;
            }
        }
        return () => {
            if (upiTimerRef.current) {
                clearInterval(upiTimerRef.current);
            }
        };
    }, [isUpiCharging, upiStartTime, station.pricePerKWh]);

    // [B.2] Start UPI Charging
    const handleUpiStart = () => {
        setUpiStartTime(Math.floor(Date.now() / 1000));
        setIsUpiCharging(true);
        setShowUpiQR(false); 
    };

    // [B.3] Stop UPI Charging & Show QR
    const handleUpiStop = () => {
        setIsUpiCharging(false); // This stops the timer
        setShowUpiQR(true); // Show the QR code
    };

    // [B.4] UPI Payment Done
    const handleUpiPaymentDone = () => {
        // Reset UPI state
        setShowUpiQR(false);
        setUpiCost(0);
        setUpiElapsedTime(0);
        setUpiPowerConsumed(0);
        // Call parent function to close the modal
        handleSessionEnd(); 
    };

    // [B.5] Go Back to Payment Selection - [UPDATED]
    const handleBackToSelection = () => {
        // Reset all states and go back
        setAccount('');
        setContract(null);
        setConnectStatus('');
        setWeb3Status('Not Started');
        setIsWeb3Charging(false);
        setWeb3Cost(0);
        setWeb3ElapsedTime(0);
        setWeb3PowerConsumed(0); // [NEW] Reset power
        setWeb3StartTime(0);

        setIsUpiCharging(false);
        setShowUpiQR(false);
        setUpiCost(0);
        setUpiElapsedTime(0);
        setUpiPowerConsumed(0);
        setUpiStartTime(0);
        
        setPaymentMethod(null);
    };

    // --- [C] RENDER FUNCTIONS ---

    // [C.1] Initial View: Payment Method Selection
    const renderPaymentSelection = () => (
        <div className="flex flex-col md:flex-row gap-4 h-full pt-4">
            {/* Left Half: Web3 */}
            <div className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <motion.button
                    onClick={() => setPaymentMethod('web3')}
                    className="w-full max-w-xs px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Pay with Wallet
                </motion.button>
                <p className="text-sm mt-3">Pay with cryptocurrency (Web3).</p>
                <p className={`text-sm mt-1 h-4 ${configStatus.includes('Error') ? 'text-red-500' : 'text-gray-400'}`}>
                    {configStatus}
                </p>
            </div>
            {/* Right Half: UPI */}
            <div className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <motion.button
                    onClick={() => setPaymentMethod('upi')}
                    className="w-full max-w-xs px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Pay by UPI
                </motion.button>
                <p className="text-sm mt-3">Pay with any UPI app.</p>
                <div className="h-4 mt-1"></div>
            </div>
        </div>
    );

    // [C.2] View: Web3 Charging Flow - [UPDATED]
    const renderWeb3Flow = () => (
        <div className="flex flex-col h-full">
            {!account ? (
                // Not connected yet
                <div className="flex-1 flex flex-col items-center justify-center">
                    <button 
                        onClick={connectWallet} 
                        className="w-full max-w-xs px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg font-semibold text-lg mb-2 disabled:bg-gray-500"
                        disabled={!contractConfig}
                    >
                        Connect Wallet
                    </button>
                    <p className={`text-sm text-center ${connectStatus.includes('Failed') || configStatus.includes('Error') ? 'text-red-500' : 'text-gray-400'}`}>
                        {connectStatus || configStatus} 
                    </p>
                </div>
            ) : (
                // Connected, show charging controls
                <div className="flex-1 flex flex-col">
                    <p className="text-sm text-green-500 mb-4">{connectStatus}</p>
                    <div className="flex gap-4 mb-4">
                        <button 
                            onClick={handleWeb3Start}
                            disabled={isWeb3Charging || web3Status.includes('Sending')}
                            className="flex-1 btn bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-500"
                        >
                            {isWeb3Charging ? 'Charging...' : 'Start Charging'}
                        </button>
                        <button 
                            onClick={handleWeb3Stop} 
                            disabled={!isWeb3Charging || web3Status.includes('Finalizing')}
                            className="flex-1 btn bg-red-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-500"
                        >
                            {web3Status.includes('Finalizing') ? 'Finalizing...' : 'Stop Charging'}
                        </button>
                    </div>

                    <div className="space-y-2 text-lg">
                        <p><strong>Status:</strong> <span className="font-mono">{web3Status}</span></p>
                        <hr className={`my-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                        <p><strong>Elapsed Time:</strong> <span className="font-mono">{web3ElapsedTime}</span> seconds</p>
                        {/* [NEW] Power Display */}
                        <p><strong>Power Consumed:</strong> <span className="font-mono">{web3PowerConsumed.toFixed(3)} kWh</span></p>
                        <p><strong>Total Cost (ETH):</strong> <span className="font-mono">{web3Cost.toFixed(6)}</span> ETH</p>
                        {/* [NEW] USD Cost Display */}
                        <p><strong>Total Cost (USD):</strong>
                            <span className="font-mono">
                                {ethToUsdRate ? `$ ${(web3Cost * ethToUsdRate).toFixed(2)}` : 'Loading price...'}
                            </span>
                        </p>
                    </div>
                </div>
            )}
            
            <button 
                onClick={handleBackToSelection} 
                className="w-full mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                disabled={isWeb3Charging} // [NEW] Disable back button while charging
            >
                Back to Payment Selection
            </button>
        </div>
    );

    // [C.3] View: UPI Charging Flow
    const renderUpiFlow = () => {
        // !!! REPLACE THIS WITH YOUR UPI ID !!!
        const YOUR_UPI_ID = 'patil.atharva115@okhdfcbank';
        // Construct the QR code URL
        const upiUrl = `upi://pay?pa=${YOUR_UPI_ID}&pn=EV%20Connect&am=${upiCost.toFixed(2)}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

        return (
            <div className="flex flex-col h-full">
                {!isUpiCharging && !showUpiQR && (
                    // 1. Start View
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <h3 className="text-xl font-semibold mb-2">Ready to Charge (UPI)</h3>
                        <p className="text-gray-400 mb-4">Press start to begin your session.</p>
                        <motion.button 
                            onClick={handleUpiStart} 
                            className="w-full max-w-xs px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Start Charging
                        </motion.button>
                    </div>
                )}

                {isUpiCharging && !showUpiQR && (
                    // 2. Charging View
                    <> 
                        <div className="flex-1 space-y-3 text-lg">
                            <p><strong>Per Unit Cost:</strong> <span className="font-mono">{station.pricePerKWh} / kWh</span></p>
                            <p><strong>Total Time Used:</strong> <span className="font-mono">{upiElapsedTime} seconds</span></p>
                            <p><strong>Total Power Consumed:</strong> <span className="font-mono">{upiPowerConsumed.toFixed(3)} kWh</span></p>
                            <p><strong>Total Costing:</strong> <span className="font-mono text-2xl font-bold">₹{upiCost.toFixed(2)}</span></p>
                        </div>
                        <motion.button 
                            onClick={handleUpiStop} 
                            className="w-full max-w-xs px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg font-semibold text-lg mx-auto"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Stop Charging & Pay
                        </motion.button>
                    </>
                )}

                {!isUpiCharging && showUpiQR && (
                    // 3. QR Code View
                    <>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h3 className="text-xl font-semibold">Scan to Pay</h3>
                            <p className="text-3xl font-bold my-2">₹{upiCost.toFixed(2)}</p>
                            <div className="p-2 bg-white rounded-lg">
                                <img 
                                    src={qrCodeUrl}
                                    alt="UPI QR Code"
                                    width={200}
                                    height={200}
                                />
                            </div>
                            <p className="text-sm mt-2">Scan with any UPI app</p>
                            <motion.button 
                                onClick={handleUpiPaymentDone} 
                                className="mt-4 w-full max-w-xs px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Payment Done
                            </motion.button>
                        </div>
                    </>
                )}
                
                <button 
                    onClick={handleBackToSelection} 
                    className="w-full mt-4 px-6 py-3 bg-gray-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                >
                    Back to Payment Selection
                </button>
            </div>
        );
    };

    // --- [D] MAIN COMPONENT RENDER ---
    return (
        <div className={`p-6 rounded-lg shadow-lg w-full h-full flex flex-col justify-center ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h2 className="text-xl font-bold mb-2">Active Charging Session</h2>
            <p className="mb-4"><span className="font-semibold">Station:</span> {station.name}</p>

            <div className="flex-1">
                {paymentMethod === null && renderPaymentSelection()}
                {paymentMethod === 'web3' && renderWeb3Flow()}
                {paymentMethod === 'upi' && renderUpiFlow()}
            </div>
        </div>
    );
};


// --- [MODIFIED] CHARGING SESSION COMPONENT ---
interface ChargingSessionProps {
    station: Station;
    isDarkMode: boolean;
    handleStartCharging: () => void;
    handleReleaseSlot: () => void;
    navigating: boolean;
    // --- ADDED PROPS ---
    isSessionActive: boolean;
    handleSessionEnd: () => void;
}

const ChargingSession: React.FC<ChargingSessionProps> = ({ 
    station, 
    isDarkMode, 
    handleStartCharging, 
    handleReleaseSlot, 
    navigating,
    // --- DESTRUCTURED PROPS ---
    isSessionActive,
    handleSessionEnd 
}) => (
    <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ${navigating ? 'h-[600px]' : 'h-[450px]'} w-full p-6`}>
        <AnimatePresence mode="wait">
            {!isSessionActive ? (
                // --- THIS IS THE ORIGINAL BOOKING UI ---
                <motion.div
                    key="booking-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col md:flex-row gap-6 w-full max-w-4xl mx-auto h-full"
                >
                    {/* Left Side: Station Info */}
                    <div className="flex-1">
                        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Charging Session</h2>
                        <div className="space-y-2">
                            <p><span className="font-semibold">Station:</span> {station.name}</p>
                            <p><span className="font-semibold">Address:</span> {station.address}</p>
                            <p><span className="font-semibold">Power:</span> {station.powerAvailable} kW</p>
                            <p><span className="font-semibold">Price:</span> {station.pricePerKWh}</p>
                            <p><span className="font-semibold">Connectors:</span> {station.connectorTypes.join(', ')}</p>
                        </div>
                    </div>

                    {/* Right Side: Action Buttons */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <motion.button
                            onClick={handleStartCharging} // This will now set isSessionActive(true)
                            className="w-full max-w-xs px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Start Charging
                        </motion.button>
                        <motion.button
                            onClick={handleReleaseSlot}
                            className="w-full max-w-xs px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg font-semibold text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Release Slot
                        </motion.button>
                    </div>
                </motion.div>
            ) : (
                // --- THIS IS THE NEW WEB3 UI ---
                <motion.div
                    key="active-charging-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full"
                >
                    <ActiveCharging 
                        isDarkMode={isDarkMode}
                        handleSessionEnd={handleSessionEnd}
                        station={station}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);


// Sample station data
const sampleStations: Station[] = [
    {
        id: '1',
        name: 'Central EV Hub',
        location: 'Downtown, Mumbai',
        address: '123 Main St, Mumbai',
        powerAvailable: 75,
        lastUpdated: '2025-06-16T12:00:00Z',
        pricePerKWh: '₹15.50',
        connectorTypes: ['CCS', 'CHAdeMO', 'Type 2'],
        status: 'Available',
        lat: 19.076,
        lng: 72.8777,
        totalSlots: 6,
        bookedSlots6AM_11AM: 4,
        bookedSlots11AM_4PM: 2,
        bookedSlots4PM_10PM: 1,
        recommended: true,
        weatherSafe: true,
        weather: { description: 'clear sky', temp: 28 },
    },
];

// Default station that will always be shown
const defaultStation: Station = {
    id: '66ccb23f81e649ef9b56f8f4', // Use a valid ID from your MongoDB
    name: 'Default Charging Station',
    location: 'Default Location',
    address: 'Default Address, Somewhere',
    powerAvailable: 100,
    lastUpdated: '2025-08-24T00:00:00Z',
    pricePerKWh: '₹10.00',
    connectorTypes: ['Type 2', 'CCS'],
    status: 'Always Available',
    lat: 19.0825,
    lng: 72.8800,
    totalSlots: 5,
    bookedSlots6AM_11AM: 0,
    bookedSlots11AM_4PM: 0,
    bookedSlots4PM_10PM: 0,
    recommended: true,
    weatherSafe: true,
    weather: { description: 'sunny', temp: 30 },
};

interface ReceiverDashboardProps {
    stations?: Station[];
}

const ReceiverDashboard: React.FC<ReceiverDashboardProps> = ({ stations = [] }) => {
    const navigate = useNavigate();

    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [navigating, setNavigating] = useState<boolean>(false);
    const [mapReady, setMapReady] = useState<boolean>(false);
    const [nearbyStations, setNearbyStations] = useState<Station[]>(stations.length > 0 ? stations : sampleStations);
    const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
    const [activeSection, setActiveSection] = useState<string>('home');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [centerAndFitBounds, setCenterAndFitBounds] = useState<boolean>(false);
    const [droppedPin, setDroppedPin] = useState<Location | null>(null);
    const [isSwitching, setIsSwitching] = useState<boolean>(false);
    const watchIdRef = useRef<number | null>(null);

    // --- NEW STATE FOR BOOKING FLOW ---
    const [isBooking, setIsBooking] = useState<boolean>(false);
    const [bookedStation, setBookedStation] = useState<Station | null>(null);
    // --- [NEW] STATE FOR ACTIVE CHARGING SESSION ---
    const [isSessionActive, setIsSessionActive] = useState<boolean>(false);


    const WEATHER_API_KEY = '927f530bb8f0a4a991cca33609d6f095';

    // Get user's initial location
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position: GeolocationPosition) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error: GeolocationPositionError) => {
                    console.error('Error getting location:', error);
                    setUserLocation({ lat: 19.076, lng: 72.8777 }); // Default to Mumbai
                }
            );
        } else {
            setUserLocation({ lat: 19.076, lng: 72.8777 });
        }
        setNearbyStations([defaultStation, ...sampleStations]);
    }, []);

    // Watch user's location during navigation
    useEffect(() => {
        if (navigating && 'geolocation' in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position: GeolocationPosition) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error: GeolocationPositionError) => {
                    console.error('Error watching location:', error);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [navigating]);

    // Center map on user's current location
    const handleCenterOnUser = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position: GeolocationPosition) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setDroppedPin(null);
                    setCenterAndFitBounds(false);
                },
                (error: GeolocationPositionError) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get current location. Ensure location services are enabled.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    // Clear dropped pin
    const handleClearPin = () => {
        setDroppedPin(null);
        setCenterAndFitBounds(false);
    };

    // Fetch weather data for a station
    const fetchWeather = async (lat: number, lng: number): Promise<{ safe: boolean; description: string; temp: number }> => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            const data = await response.json();
            const isSafe = !(
                (data.weather[0].id >= 200 && data.weather[0].id < 600) ||
                data.main.temp < 0 ||
                data.main.temp > 40 ||
                data.wind.speed * 3.6 > 50
            );
            return {
                safe: isSafe,
                description: data.weather[0].description,
                temp: Math.round(data.main.temp),
            };
        } catch (error) {
            console.error('Error fetching weather:', error);
            return { safe: true, description: 'Unknown', temp: 0 };
        }
    };

    // Fetch recommendation for a station using /api/test_prediction
    const fetchStationRecommendation = async (station: Station): Promise<boolean> => {
        try {
            const now = new Date();
            const hour = now.getHours();
            let timeSlot: string;
            if (6 <= hour && hour < 11) {
                timeSlot = '6AM-11AM';
            } else if (11 <= hour && hour < 16) {
                timeSlot = '11AM-4PM';
            } else if (16 <= hour && hour < 22) {
                timeSlot = '4PM-10PM';
            } else {
                timeSlot = '11AM-4PM'; // Default
            }

            const bookedSlots = {
                '6AM-11AM': station.bookedSlots6AM_11AM,
                '11AM-4PM': station.bookedSlots11AM_4PM,
                '4PM-10PM': station.bookedSlots4PM_10PM,
            }[timeSlot] || 0;

            const response = await fetch('http://localhost:5000/api/test_prediction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    total_slots: station.totalSlots,
                    booked_slots: bookedSlots,
                    time_slot: timeSlot,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommendation');
            }

            const data = await response.json();
            console.log(`Recommendation for ${station.name}:`, data.recommended);
            return data.recommended;
        } catch (error) {
            console.error('Error fetching recommendation:', error);
            return false; // Fallback to false
        }
    };

    // Fetch availability predictions
    const fetchAvailabilityPredictions = async () => {
        const location = droppedPin || userLocation;
        if (!location) {
            console.warn('No location available');
            alert('Location not available. Enable location services or drop a pin on the map.');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Fetching availability predictions for:', { lat: location.lat, lng: location.lng });
            const response = await fetch('http://localhost:5000/api/availability-prediction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    lat: location.lat,
                    lng: location.lng,
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch availability predictions: ${response.status} ${errorText}`);
            }

            const data: Station[] = await response.json();
            console.log('Availability predictions response:', data);
            if (!Array.isArray(data)) {
                console.warn('Received non-array response:', data);
                throw new Error('Invalid response format: expected an array');
            }

            const updatedStations = await Promise.all(
                data.map(async (station: Station) => {
                    console.log('Processing station:', station.name);
                    const weather = await fetchWeather(station.lat, station.lng);
                    const recommended = await fetchStationRecommendation(station);
                    return {
                        ...station,
                        weatherSafe: weather.safe,
                        weather: { description: weather.description, temp: weather.temp },
                        recommended,
                        connectorTypes: station.connectorTypes || [],
                    };
                })
            );
            const finalStations = [defaultStation, ...updatedStations];
            console.log('Updated stations:', finalStations);
            setNearbyStations(finalStations);
            setSelectedStation(null);
            setNavigating(false);
            setCenterAndFitBounds(true);
        } catch (error: any) {
            console.error('Error fetching availability predictions:', error.message, error.stack);
            alert(`Failed to fetch availability predictions: ${error.message}. Showing default stations.`);
            setNearbyStations([defaultStation, ...sampleStations]);
            setCenterAndFitBounds(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Handler to trigger the provider dashboard switch
    const handleSwitchToProvider = () => {
        setIsSwitching(true);
        setTimeout(() => {
            setIsSwitching(false);
            navigate('/Provider_Dashboard');
        }, 2000); // 2-second animation delay
    };

    const handleNavigate = (station: Station) => {
        setSelectedStation(station);
        setNavigating(true);
        setCenterAndFitBounds(false);
        setActiveSection('home');
    };

    // --- UPDATED BOOKING HANDLER ---
    const handleBook = (station: Station) => {
        setBookedStation(station);
        setIsBooking(true); 
    };

    // --- [MODIFIED] HANDLERS FOR CHARGING SESSION ---
    const handleStartCharging = () => {
        console.log("Activating Web3 session for station:", bookedStation?.name);
        setIsSessionActive(true); // This will swap the component view
    };

    const handleReleaseSlot = () => {
        setIsBooking(false);
        setIsSessionActive(false); // Also reset the session state
        setTimeout(() => {
             setBookedStation(null);
        }, 300);
    };

    // --- [NEW] HANDLER TO END WEB3 SESSION ---
    const handleSessionEnd = () => {
        setIsSessionActive(false);
        // We will let the user click "Release Slot" manually
        // handleReleaseSlot(); 
    };


    const handleCancelNavigation = () => {
        setSelectedStation(null);
        setNavigating(false);
        setCenterAndFitBounds(false);
    };

    const handleMapTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMapType(e.target.value as 'street' | 'satellite' | 'hybrid');
    };

    return (
        <>
            <AnimatePresence>
                {isSwitching && <TransitionLoader />}
            </AnimatePresence>
            <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <Navbar
                    setActiveSection={setActiveSection}
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    activeSection={activeSection}
                    onSwitchToProvider={handleSwitchToProvider}
                />
                <AnimatePresence mode="wait">
                    {activeSection === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="container mx-auto px-4 py-8 pt-20"
                        >
                            <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 rounded-lg shadow-md mb-8 text-white">
                                <h1 className="text-2xl font-bold mb-2">{navigating ? 'Navigation Mode' : 'Welcome to EV Connect'}</h1>
                                <p className="text-sm opacity-90">
                                    {navigating ? `Navigating to ${selectedStation?.name}` : 'Find and navigate to charging stations near you'}
                                </p>
                            </div>

                            <div className="mb-6">
                                <div className={`rounded-lg overflow-hidden shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="p-4 flex items-center">
                                        <label htmlFor="mapType" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`}>
                                            Map Type:
                                        </label>
                                        <select
                                            id="mapType"
                                            value={mapType}
                                            onChange={handleMapTypeChange}
                                            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                                isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'
                                            }`}
                                        >
                                            <option value="street">Street</option>
                                            <option value="satellite">Satellite</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className={`${navigating ? 'h-[600px]' : 'h-[450px]'} w-full relative transition-all duration-300`}>
                                        <AnimatePresence mode="wait">
                                            {isBooking && bookedStation ? (
                                                <motion.div
                                                    key="charging-session"
                                                    className="h-full w-full"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {/* --- [MODIFIED] CHARGING SESSION RENDER --- */}
                                                    <ChargingSession 
                                                        station={bookedStation} 
                                                        isDarkMode={isDarkMode}
                                                        handleStartCharging={handleStartCharging}
                                                        handleReleaseSlot={handleReleaseSlot}
                                                        navigating={navigating}
                                                        isSessionActive={isSessionActive}
                                                        handleSessionEnd={handleSessionEnd}
                                                    />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="map-view"
                                                    className="h-full w-full"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {isLoading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[1000]">
                                                            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {userLocation ? (
                                                        <MapContainer
                                                            center={[userLocation.lat, userLocation.lng] as LatLngExpression}
                                                            zoom={13}
                                                            className="h-full w-full"
                                                            style={{ height: '100%', width: '100%' }}
                                                            whenReady={() => setMapReady(true)}
                                                        >
                                                            <MapLayers mapType={mapType} />
                                                            <MapController
                                                                navigating={navigating}
                                                                userLocation={userLocation}
                                                                nearbyStations={nearbyStations}
                                                                centerAndFitBounds={centerAndFitBounds}
                                                                droppedPin={droppedPin}
                                                            />
                                                            <MapClickHandler setDroppedPin={setDroppedPin} />
                                                            <Marker position={[userLocation.lat, userLocation.lng] as LatLngExpression} icon={navigating ? navigationIcon : userIcon}>
                                                                <Popup>
                                                                    <strong>{navigating ? 'Navigating' : 'Your Location'}</strong>
                                                                </Popup>
                                                            </Marker>
                                                            {droppedPin && (
                                                                <Marker position={[droppedPin.lat, droppedPin.lng] as LatLngExpression} icon={pinIcon}>
                                                                    <Popup>
                                                                        <strong>Dropped Pin</strong>
                                                                    </Popup>
                                                                </Marker>
                                                            )}
                                                            {nearbyStations.map((station) => (
                                                                <motion.div
                                                                    key={station.id}
                                                                    initial={{ scale: 0.8 }}
                                                                    animate={{ scale: 1, y: [0, -8] }}
                                                                    transition={{
                                                                        y: {
                                                                            type: 'spring',
                                                                            stiffness: 200,
                                                                            damping: 20,
                                                                            repeat: Infinity,
                                                                            repeatType: 'reverse',
                                                                            duration: 1.5,
                                                                        },
                                                                    }}
                                                                >
                                                                    <Marker
                                                                        position={[station.lat, station.lng] as LatLngExpression}
                                                                        icon={station.id === 'default-station' ? defaultStationIcon : (station.recommended && station.weatherSafe ? availableIcon : unavailableIcon)}
                                                                    >
                                                                        <Popup>
                                                                            <div className="p-2 max-w-[200px]">
                                                                                <h3 className="font-semibold text-sm">{station.name}</h3>
                                                                                <p className="text-xs">{station.location}</p>
                                                                                <p className="text-xs">Power: {station.powerAvailable} kW</p>
                                                                                <p className="text-xs">Price: {station.pricePerKWh}</p>
                                                                                <p className="text-xs">
                                                                                    Status:{' '}
                                                                                    <span className={station.recommended && station.weatherSafe ? 'text-green-600' : 'text-red-600'}>
                                                                                        {station.recommended && station.weatherSafe ? 'Recommended' : 'Not Recommended'}
                                                                                    </span>
                                                                                </p>
                                                                                {station.weather && (
                                                                                    <p className="text-xs">Weather: {station.weather.description} ({station.weather.temp}°C)</p>
                                                                                )}
                                                                                {station.arrivalTime && (
                                                                                    <p className="text-xs">Arrival: {station.arrivalTime}</p>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => handleNavigate(station)}
                                                                                    className={`mt-2 px-2 py-1 text-xs rounded text-white ${
                                                                                        station.recommended && station.weatherSafe
                                                                                            ? 'bg-green-600 hover:bg-green-700'
                                                                                            : 'bg-gray-400 cursor-not-allowed'
                                                                                    }`}
                                                                                    disabled={!(station.recommended && station.weatherSafe)}
                                                                                >
                                                                                    Navigate
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleBook(station)}
                                                                                    className={`mt-2 ml-1 px-2 py-1 text-xs rounded text-white ${
                                                                                        station.recommended && station.weatherSafe
                                                                                            ? 'bg-blue-600 hover:bg-blue-700'
                                                                                            : 'bg-gray-400 cursor-not-allowed'
                                                                                    }`}
                                                                                    disabled={!(station.recommended && station.weatherSafe)}
                                                                                >
                                                                                    Book
                                                                                </button>
                                                                            </div>
                                                                        </Popup>
                                                                    </Marker>
                                                                </motion.div>
                                                            ))}
                                                            {navigating && selectedStation && userLocation && mapReady && (
                                                                <RoutingMachine userLocation={userLocation} destination={selectedStation} />
                                                            )}
                                                        </MapContainer>
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                                            <p className="text-gray-600">Waiting for location access...</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Buttons overlayed on the map/charging container */}
                                        <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
                                            <motion.button
                                                onClick={fetchAvailabilityPredictions}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Check Availability
                                            </motion.button>
                                        </div>
                                        <div className="absolute bottom-4 left-4 z-[1000] flex space-x-2">
                                            <motion.button
                                                onClick={handleCenterOnUser}
                                                className="p-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
                                                title="Center on My Location"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </motion.button>
                                            <motion.button
                                                onClick={handleClearPin}
                                                className="p-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none"
                                                title="Clear Dropped Pin"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </motion.button>
                                        </div>
                                        {navigating && selectedStation && (
                                            <div
                                                className={`absolute bottom-4 left-0 right-0 mx-auto w-11/12 sm:w-3/4 md:w-1/2 p-4 rounded-lg shadow-lg z-[1000] border ${
                                                    isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                            {selectedStation.name}
                                                        </h3>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {selectedStation.location}
                                                        </p>
                                                    </div>
                                                    <motion.button
                                                        onClick={handleCancelNavigation}
                                                        className={`px-3 py-1 rounded text-sm ${
                                                            isDarkMode
                                                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    Nearby Charging Stations
                                </h2>
                                {isLoading ? (
                                    <div className="flex justify-center">
                                        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <ViewStations stations={nearbyStations} handleNavigate={handleNavigate} handleBook={handleBook} isDarkMode={isDarkMode} />
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'stations' && (
                        <motion.div
                            key="stations"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="container mx-auto px-4 py-8 pt-20"
                        >
                            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                Nearby Charging Stations
                            </h2>
                            {isLoading ? (
                                <div className="flex justify-center">
                                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <ViewStations stations={nearbyStations} handleNavigate={handleNavigate} handleBook={handleBook} isDarkMode={isDarkMode} />
                            )}
                        </motion.div>
                    )}

                    {activeSection === 'ev-status' && (
                        <motion.div
                            key="ev-status"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="container mx-auto px-4 py-8 pt-20"
                        >
                            <EVStatus isDarkMode={isDarkMode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default ReceiverDashboard;