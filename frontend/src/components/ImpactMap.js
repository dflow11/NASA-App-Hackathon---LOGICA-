import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import MapLegend from './MapLegend';
import 'leaflet/dist/leaflet.css';

// Helper component to update map view when props change
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

function ImpactMap({ impactLocation, impactResults, onMapClick, mapZoom }) {
  const map = useMap();

  // Attach click handler to the map instance
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {impactLocation && impactResults && (
        <>
          {/* Red Circle: Evacuation Zone */}
          <Circle
            center={impactLocation}
            pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.4 }}
            radius={impactResults.severe_blast_km * 1000} // Convert km to meters
          />
          {/* Black Circle: Impact Site */}
          <Circle
            center={impactLocation}
            pathOptions={{ fillColor: 'black', color: 'black', fillOpacity: 0.6 }}
            radius={impactResults.crater_km * 1000} // Convert km to meters
          />
        </>
      )}
      <MapUpdater center={impactLocation} zoom={mapZoom} />
    </>
  );
}

function ImpactMapWrapper(props) {
  // Default position if no impact is selected yet
  const position = props.impactLocation || [34.0522, -118.2437];

  return (
    <MapContainer center={position} zoom={4} style={{ gridArea: 'map', height: '100%', width: '100%' }}>
      <ImpactMap {...props} />
      <MapLegend />
    </MapContainer>
  );
}

export default ImpactMapWrapper;