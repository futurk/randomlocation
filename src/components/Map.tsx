import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  centerLat: number | null;
  centerLng: number | null;
  randomLat: number | null;
  randomLng: number | null;
  radius: number; // in km
  isDarkMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}

// Custom DivIcon for Center point (Blue pulsing beacon)
const centerIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      <div class="absolute w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
    </div>
  `,
  className: "custom-center-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom DivIcon for Random point (Red map pin)
const randomIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-10 h-10">
      <svg class="w-8 h-8 filter drop-shadow-md transform transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#EF4444"/>
      </svg>
    </div>
  `,
  className: "custom-random-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 36],
});

// Component to handle map center changes and fitting bounds smoothly
const MapController: React.FC<{
  centerLat: number | null;
  centerLng: number | null;
  randomLat: number | null;
  randomLng: number | null;
}> = ({ centerLat, centerLng, randomLat, randomLng }) => {
  const map = useMap();

  useEffect(() => {
    if (centerLat !== null && centerLng !== null) {
      if (randomLat !== null && randomLng !== null) {
        // Compute bounds to include both Center and Random pins
        const bounds = L.latLngBounds(
          [centerLat, centerLng],
          [randomLat, randomLng]
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
      } else {
        // Smoothly pan to the new center
        map.setView([centerLat, centerLng], 13, { animate: true });
      }
    }
  }, [centerLat, centerLng, randomLat, randomLng, map]);

  return null;
};

// Component to capture click events on the map
const MapEvents: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const Map: React.FC<MapProps> = ({
  centerLat,
  centerLng,
  randomLat,
  randomLng,
  radius,
  isDarkMode,
  onMapClick,
}) => {
  // Fallback initial center if nothing is loaded (defaults to Paris center coordinates for aesthetic starting place instead of Null Island)
  const defaultCenterLat = 48.8566;
  const defaultCenterLng = 2.3522;

  const initialLat = centerLat ?? defaultCenterLat;
  const initialLng = centerLng ?? defaultCenterLng;

  return (
    <MapContainer
      center={[initialLat, initialLng]}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}
      zoomControl={false} // We will use standard zoom or let Leaflet handle it, but moving it is nice. We will keep it enabled but styled well.
    >
      <TileLayer
        url={
          isDarkMode
            ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        }
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> contributors'
      />

      <MapController
        centerLat={centerLat}
        centerLng={centerLng}
        randomLat={randomLat}
        randomLng={randomLng}
      />

      <MapEvents onMapClick={onMapClick} />

      {/* Center point Marker */}
      {centerLat !== null && centerLng !== null && (
        <Marker position={[centerLat, centerLng]} icon={centerIcon}>
          <Popup>
            <div className="text-center font-sans">
              <span className="font-semibold text-blue-600 block text-xs uppercase tracking-wide">Search Center</span>
              <span className="text-sm font-medium">
                {centerLat.toFixed(6)}, {centerLng.toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Geofence Search Circle */}
      {centerLat !== null && centerLng !== null && (
        <Circle
          center={[centerLat, centerLng]}
          radius={radius * 1000} // radius in meters
          pathOptions={{
            color: isDarkMode ? "#3B82F6" : "#2563EB",
            fillColor: isDarkMode ? "#60A5FA" : "#3B82F6",
            fillOpacity: 0.12,
            weight: 2,
            dashArray: "4, 6",
          }}
        />
      )}

      {/* Generated Random point Marker */}
      {randomLat !== null && randomLng !== null && (
        <Marker position={[randomLat, randomLng]} icon={randomIcon}>
          <Popup>
            <div className="text-center font-sans p-1">
              <span className="font-bold text-red-500 block text-xs uppercase tracking-wide mb-1">Random Location</span>
              <span className="text-sm font-semibold">
                {randomLat.toFixed(6)}, {randomLng.toFixed(6)}
              </span>
              <div className="mt-2 border-t pt-2 flex flex-col gap-1 text-xs">
                <a
                  href={`https://www.google.com/maps?q=${randomLat},${randomLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
