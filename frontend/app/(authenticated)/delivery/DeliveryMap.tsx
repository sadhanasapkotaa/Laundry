"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { Delivery } from '../../services/deliveryService';

// Icons for Pickup and Delivery
const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const completedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface DeliveryMapProps {
    deliveries: Delivery[];
    height?: string;
}

// Helper to fit bounds
const FitBounds: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [coords, map]);
    return null;
};

// Helper to extract coordinates from Google Maps/OSM links or address field
const getCoordinates = (link?: string, address?: string): [number, number] | null => {
    if (link) {
        // Try to parse standard Google Maps or OSM link params
        // Example: https://www.openstreetmap.org/?mlat=27.6713&mlon=85.3387&zoom=16
        const osmMatch = link.match(/mlat=([^&]+)&mlon=([^&]+)/);
        if (osmMatch) return [parseFloat(osmMatch[1]), parseFloat(osmMatch[2])];

        // Example: Google Maps link often just has query, hard to parse lat/lng directly without API.
        // But our system saves OSM links from MapAddressSelector usually.
    }
    return null; // Fallback or handling would happen elsewhere
};

export default function DeliveryMap({ deliveries, height = "400px" }: DeliveryMapProps) {
    // Filter out deliveries without coordinates
    const mapItems = deliveries.map((d, index) => {
        // We look for 'map_link' in the delivery object (which should have it if migrated)
        // Note: The `Delivery` interface in deliveryService.ts might need updating to include `map_link` or we fallback to parsing.
        // Assuming current backend sends `delivery_address` which might NOT have coords?
        // Wait, MapAddressSelector generates a link. We should try to extract from that if stored.
        // The backend model `Delivery` has `delivery_address` charfield.
        // `UserAddress` has `map_link`.
        // Let's assume for now we might not have it on `Delivery` object unless we join or parsing.
        // The previous code `getMapLink` just generated a search query.

        // However, the `MapAddressSelector` stored `map_link` in the Order/UserAddress.
        // If `Delivery` object is what we have, does it have `map_link`?
        // The `Delivery` model in Step 59 does NOT have `map_link`.
        // Wait, migration 0004 `order_delivery_address_order_delivery_map_link`...
        // Migration 0006 `remove_order_delivery_address...`
        // It seems `Delivery` model might be the source of truth?
        // `Delivery` model in Step 59: `delivery_address` (Char). No map_link.
        // Only `UserAddress` has `map_link`.

        // This is a problem. The Map Visualization won't work if we don't have coordinates.
        // BUT, the user prompt asked for "interactive map where each location is shown".
        // If we don't have coords, we can't show them.
        // I should assume the `delivery_address` might contain coordinates or we need to geocode.
        // OR `Delivery` model should have `map_link`?
        // Let's check `orders/migrations/0004`... it added `delivery_map_link` to ORDER.

        // If `Delivery` is linked to `Order`, maybe we can pull it from there?
        // `Delivery` -> `Order`.
        // Does `deliveryAPI.list()` return order details including map link?
        // I should check `deliveryService.ts` again. Its interface doesn't show `map_link`.
        // I'll add `map_link` to the interface and hope the serializer sends it (or I update serializer).
        // Since I'm in implementation, I SHOULD update the serializer to include `map_link` if available on Order or address.

        // For now, let's write the component assuming `d.map_link` or `d.coordinates` exists.
        // I will update the service/serializer in next step.

        // Mock logic for parsing if the address string happens to have it, or use the link
        const coords = getCoordinates((d as any).map_link);
        return { ...d, coords, index };
    }).filter(item => item.coords !== null);

    const positions: [number, number][] = mapItems.map(i => i.coords!);

    return (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm" style={{ height }}>
            {mapItems.length === 0 ? (
                <div className="h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    No location data available for today's tasks.
                </div>
            ) : (
                <MapContainer center={[27.7172, 85.3240]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FitBounds coords={positions} />

                    {/* Route Line */}
                    <Polyline
                        positions={positions}
                        color="#3b82f6"
                        weight={3}
                        opacity={0.6}
                        dashArray="10, 10"
                    />

                    {/* Markers */}
                    {mapItems.map((item) => (
                        <Marker
                            key={item.id}
                            position={item.coords!}
                            icon={
                                item.status === 'delivered' ? completedIcon :
                                    item.delivery_type === 'pickup' ? pickupIcon : deliveryIcon
                            }
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-sm">{item.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'} #{item.index + 1}</h3>
                                    <p className="text-xs">{item.delivery_time} • {item.delivery_address}</p>
                                    <p className="text-xs font-semibold">{item.customer_name}</p>
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                <span className="font-bold">{item.index + 1}</span>
                            </Tooltip>
                        </Marker>
                    ))}
                </MapContainer>
            )}
        </div>
    );
}
