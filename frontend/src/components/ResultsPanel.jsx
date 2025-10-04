import React from 'react';

const ResultsPanel = ({ impactResults }) => {
  if (!impactResults) return null;

  return (
    <div>
      <h2>Impact Results</h2>
      <p>Energy: {impactResults.energy_megatons.toFixed(2)} Mt TNT</p>
      <p>Crater Size: {impactResults.crater_km.toFixed(2)} km</p>
      <p>Blast Radius: {impactResults.blast_radius_km.toFixed(2)} km</p>
    </div>
  );
};

export default ResultsPanel;
