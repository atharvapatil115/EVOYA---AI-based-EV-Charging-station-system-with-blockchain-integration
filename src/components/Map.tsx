import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

interface MapProps {
  stations: Array<{
    id: number;
    name: string;
    lat: number;
    lng: number;
    availability: string;
    address: string;
    type: string;
    power: string;
  }>;
  selectedStation: {
    id: number;
    lat: number;
    lng: number;
  } | null;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
}

const Map: React.FC<MapProps> = ({ stations, selectedStation, userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize the map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const defaultLocation = [40.7128, -74.006]; // New York
      
      // Create map
      mapInstanceRef.current = L.map(mapRef.current).setView(
        userLocation ? [userLocation.lat, userLocation.lng] : defaultLocation,
        13
      );
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      // Fix default marker icon issue
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      
      L.Marker.prototype.options.icon = defaultIcon;
    }
    
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    
    // Create user marker
    const userIcon = L.divIcon({
      html: '<div class="bg-blue-500 h-4 w-4 rounded-full border-2 border-white"></div>',
      className: 'user-location-marker',
      iconSize: [20, 20]
    });
    
    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000 // Ensure user marker is on top
    }).addTo(map);
    
    userMarker.bindPopup('Your Location').openPopup();
    
    // Center map on user location
    map.setView([userLocation.lat, userLocation.lng], 13);
    
    return () => {
      map.removeLayer(userMarker);
    };
  }, [userLocation]);
  
  // Add/update station markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    
    // Create custom icon function
    const createCustomIcon = (available: boolean) => {
      return L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${available ? '#10B981' : '#FBBF24'}" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-16h-9l1-4z"/>
        </svg>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    };
    
    // Add station markers
    stations.forEach(station => {
      const marker = L.marker([station.lat, station.lng], {
        icon: createCustomIcon(station.availability === 'Available')
      }).addTo(map);
      
      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold">${station.name}</h3>
          <p>${station.address}</p>
          <p class="${station.availability === 'Available' ? 'text-green-600' : 'text-yellow-600'}">
            ${station.availability}
          </p>
          <p class="text-sm">${station.type} • ${station.power}</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [stations]);
  
  // Handle routing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStation || !userLocation) return;
    
    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }
    
    // Create routing control
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(selectedStation.lat, selectedStation.lng)
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      lineOptions: {
        styles: [
          { color: '#10B981', opacity: 0.8, weight: 6 }
        ]
      },
      createMarker: function(i, wp) {
        // Use custom icons for start/end points
        if (i === 0) {
          return L.marker(wp.latLng, {
            icon: L.divIcon({
              html: '<div class="bg-blue-500 rounded-full h-4 w-4 border-2 border-white"></div>',
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          });
        } else {
          return L.marker(wp.latLng, {
            icon: L.divIcon({
              html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10B981" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-16h-9l1-4z"/>
              </svg>`,
              className: '',
              iconSize: [24, 24],
              iconAnchor: [12, 24]
            })
          });
        }
      },
      fitSelectedRoutes: true
    }).addTo(map);
    
    // Cleanup routing control on unmount
    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [selectedStation, userLocation]);
  
  return <div ref={mapRef} className="h-full w-full" />;
};

export default Map;