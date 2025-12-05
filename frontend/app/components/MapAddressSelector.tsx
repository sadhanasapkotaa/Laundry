"use client";

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapAddressSelectorProps {
  onAddressSelect: (address: string, mapLink: string) => void;
  initialAddress?: string;
  initialMapLink?: string;
  height?: string;
}

interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (position: { lat: number; lng: number }) => void;
  onLocationSelect: (address: string, mapLink: string) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPosition);

      // Reverse geocoding to get address
      reverseGeocode(newPosition.lat, newPosition.lng).then((address) => {
        const mapLink = `https://www.openstreetmap.org/?mlat=${newPosition.lat}&mlon=${newPosition.lng}&zoom=16`;
        onLocationSelect(address, mapLink);
      });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}>
      <Popup>Selected location</Popup>
    </Marker>
  );
};

// Reverse geocoding function using Nominatim API
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return `${lat}, ${lng}`;
  }
};

// Forward geocoding function
const forwardGeocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    return null;
  }
};

const MapAddressSelector: React.FC<MapAddressSelectorProps> = ({
  onAddressSelect,
  initialAddress,
  initialMapLink,
  height = '400px'
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState(initialAddress || '');
  const mapRef = useRef<L.Map | null>(null);

  // Extract coordinates from initial map link if provided
  useEffect(() => {
    if (initialMapLink && !position) {
      const match = initialMapLink.match(/mlat=([^&]+)&mlon=([^&]+)/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        setPosition({ lat, lng });
      }
    }
  }, [initialMapLink, position]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const userPos = {
            lat: geoPosition.coords.latitude,
            lng: geoPosition.coords.longitude
          };
          setUserLocation(userPos);

          // If no initial position provided, use user's location
          if (!position) {
            setPosition(userPos);
            // Get address for user's location
            reverseGeocode(userPos.lat, userPos.lng).then((address) => {
              setSearchAddress(address);
              const mapLink = `https://www.openstreetmap.org/?mlat=${userPos.lat}&mlon=${userPos.lng}&zoom=16`;
              onAddressSelect(address, mapLink);
            });
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Default to Kathmandu, Nepal if geolocation fails
          const defaultPos = { lat: 27.7172, lng: 85.3240 };
          setUserLocation(defaultPos);
          if (!position) {
            setPosition(defaultPos);
            setSearchAddress('Kathmandu, Nepal');
            const mapLink = `https://www.openstreetmap.org/?mlat=${defaultPos.lat}&mlon=${defaultPos.lng}&zoom=16`;
            onAddressSelect('Kathmandu, Nepal', mapLink);
          }
          setIsLoading(false);
        }
      );
    } else {
      // Geolocation not supported, use default location
      const defaultPos = { lat: 27.7172, lng: 85.3240 };
      setUserLocation(defaultPos);
      if (!position) {
        setPosition(defaultPos);
        setSearchAddress('Kathmandu, Nepal');
        const mapLink = `https://www.openstreetmap.org/?mlat=${defaultPos.lat}&mlon=${defaultPos.lng}&zoom=16`;
        onAddressSelect('Kathmandu, Nepal', mapLink);
      }
      setIsLoading(false);
    }
  }, [position, onAddressSelect]);

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;

    const coordinates = await forwardGeocode(searchAddress);
    if (coordinates) {
      setPosition(coordinates);
      const mapLink = `https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=16`;
      onAddressSelect(searchAddress, mapLink);

      // Pan map to the new location
      if (mapRef.current) {
        mapRef.current.setView([coordinates.lat, coordinates.lng], 16);
      }
    } else {
      alert('Address not found. Please try a different address or click on the map.');
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setPosition(userLocation);
      reverseGeocode(userLocation.lat, userLocation.lng).then((address) => {
        setSearchAddress(address);
        const mapLink = `https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}&zoom=16`;
        onAddressSelect(address, mapLink);
      });

      // Pan map to user's location
      if (mapRef.current) {
        mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading map...</span>
      </div>
    );
  }

  const center = position || userLocation || { lat: 27.7172, lng: 85.3240 };

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
            placeholder="Search for an address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={handleSearchAddress}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Use Current Location
        </button>
      </div>

      {/* Map */}
      <div style={{ height }} className="border border-gray-300 rounded-md overflow-hidden">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={onAddressSelect}
          />
        </MapContainer>
      </div>

      {/* Selected Address Display */}
      {position && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">Selected Address:</p>
          <p className="font-medium">{searchAddress}</p>
          <p className="text-xs text-gray-500">
            Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Click on the map to select a location, search for an address, or use your current location.
      </p>
    </div>
  );
};

export default MapAddressSelector;
