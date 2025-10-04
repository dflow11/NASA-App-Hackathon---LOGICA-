import React from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ClickableMap = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const ImpactMap = ({ impactLocation, impactResults, onMapClick }) => {
  const center = [0, 0];

  return (
    <MapContainer center={center} zoom={2} style={{ height: '400px', width: '100%', marginBottom: '1rem' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickableMap onMapClick={onMapClick} />
      {impactLocation && impactResults && (
        <>
          <Circle center={impactLocation} radius={impactResults.crater_km * 1000} color="red" />
          <Circle center={impactLocation} radius={impactResults.blast_radius_km * 1000} color="orange" />
        </>
      )}
    </MapContainer>
  );
};

export default ImpactMap;
