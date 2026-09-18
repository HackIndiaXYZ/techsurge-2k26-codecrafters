import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Approximate center of Andhra Pradesh
const DEFAULT_CENTER = [15.9129, 79.7400];
const DEFAULT_ZOOM = 6;

export default function HotspotMap({ data }) {
  const [mapError, setMapError] = useState(false);

  // If map data failed or leaflet throws
  if (mapError) {
    return (
      <div className="bg-red-50 p-6 rounded flex items-center justify-center text-red-600 border border-red-200 h-64">
        Failed to load map interface. Please check your connection.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded flex items-center justify-center text-gray-500 border border-gray-200 h-64 italic">
        No hotspot data to display.
      </div>
    );
  }

  // Calculate scaling for circle markers based on count
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{ height: 400, width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | SYNTHETIC DATA'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          fallback="Failed to load map tiles"
        />
        
        {data.map((bucket, i) => {
          // Normalize radius between 10 and 40 based on relative volume
          const radius = 10 + (30 * (bucket.count / maxCount));
          
          return (
            <CircleMarker
              key={`${bucket.shopCode}-${i}`}
              center={[bucket.latitude, bucket.longitude]}
              radius={radius}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#b91c1c',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.5
              }}
            >
              <Tooltip>
                <div className="text-xs">
                  <strong>Shop Code:</strong> {bucket.shopCode}<br/>
                  <strong>Failures:</strong> {bucket.count}<br/>
                  <strong>District:</strong> {bucket.district}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
