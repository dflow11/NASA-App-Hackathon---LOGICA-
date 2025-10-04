import React from 'react';

const DeflectionPanel = ({ deltaV, setDeltaV }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h3>Deflection Simulation (Δv)</h3>
      <input
        type="range"
        min="0"
        max="5"
        step="0.1"
        value={deltaV}
        onChange={(e) => setDeltaV(parseFloat(e.target.value))}
      />
      <span style={{ marginLeft: '0.5rem' }}>{deltaV} km/s</span>
    </div>
  );
};

export default DeflectionPanel;
