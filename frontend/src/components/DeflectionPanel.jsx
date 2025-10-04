import React from 'react';

const DeflectionPanel = ({ deltaLng, setDeltaLng, deltaLat, setDeltaLat }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3>Deflection Simulation (Δv)</h3>

      <label>
        Longitude (X-axis):
        <input
          type="range"
          min={-5}
          max={5}
          step={0.1}
          value={deltaLng}
          onChange={(e) => setDeltaLng(parseFloat(e.target.value))}
        />
        <span style={{ marginLeft: '0.5rem' }}>{deltaLng.toFixed(1)}°</span>
      </label>
      <br />

      <label>
        Latitude (Y-axis):
        <input
          type="range"
          min={-5}
          max={5}
          step={0.1}
          value={deltaLat}
          onChange={(e) => setDeltaLat(parseFloat(e.target.value))}
        />
        <span style={{ marginLeft: '0.5rem' }}>{deltaLat.toFixed(1)}°</span>
      </label>
    </div>
  );
};

export default DeflectionPanel;
