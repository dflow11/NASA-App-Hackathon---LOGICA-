import React from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ClickableMap = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]) });
  return null;
};

const ZoomAwareMarker = ({ center, km, color }) => {
  const map = useMap();

  // Inverse scale: smaller when zoomed out, bigger when zoomed in
  const baseZoom = 2; // zoom level where marker is "normal size"
  const zoomFactor = Math.pow(2, map.getZoom() - baseZoom); // doubles each zoom step
  const radius = Math.max(3, km / zoomFactor); // km divided by zoom factor

  return <CircleMarker center={center} radius={radius} pathOptions={{ color, fillOpacity: 0.5 }} />;
};



const ImpactMap = ({ impactLocation, impactResults, onMapClick }) => {
  const center = [0, 0];

  return (
    <MapContainer center={center} zoom={2} maxBounds={[[ -90, -180 ], [ 90, 180 ]]} style={{ height: '400px', width: '100%', marginBottom: '1rem' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickableMap onMapClick={onMapClick} />

      {impactLocation && impactResults && (
        <>
          {/* Real-world circles */}
          <Circle center={impactLocation} radius={impactResults.crater_km * 1000} pathOptions={{ color: 'red', fillOpacity: 0.3 }} />
          <Circle center={impactLocation} radius={impactResults.blast_radius_km * 1000} pathOptions={{ color: 'orange', fillOpacity: 0.2 }} />

          {/* Zoom-friendly markers */}
          <ZoomAwareMarker center={impactLocation} km={impactResults.crater_km} color="red" />
          <ZoomAwareMarker center={impactLocation} km={impactResults.blast_radius_km} color="orange" />
        </>
      )}
    </MapContainer>
  );
};

export default ImpactMap;
