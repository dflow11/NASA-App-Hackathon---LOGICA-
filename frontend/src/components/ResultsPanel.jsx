import React from 'react';

const ResultsPanel = ({ impactResults }) => {
  if (!impactResults) return null;

  return (
    <div>
      <h2>Impact Results</h2>
      <p>Energy: {impactResults.energy_megatons.toFixed(2)} Mt TNT</p>
      <p>Crater Size: {impactResults.crater_km.toFixed(2)} km</p>
      <p>Blast Radius: {impactResults.blast_radius_km.toFixed(2)} km</p>
          {impactResults.casualties !== null ? <p>Casualties: {impactResults.casualties}</p> : null}
          {impactResults.tsunami ? (
            <div>
              <h3>Tsunami Estimate</h3>
              {impactResults.tsunami.elevation_m !== null ? <p>Elevation: {impactResults.tsunami.elevation_m} m</p> : null}
              <p>Is water: {String(impactResults.tsunami.is_water)}</p>
              {impactResults.tsunami.tsunami ? (
                <>
                  <p>Initial wave (m): {impactResults.tsunami.tsunami.initial_wave_height_m.toFixed(2)}</p>
                  <p>Shore wave (m): {impactResults.tsunami.tsunami.shore_wave_height_m.toFixed(2)}</p>
                  <p>Estimated inundation (m): {impactResults.tsunami.tsunami.inundation_m.toFixed(1)}</p>
                  <p>Damage level: {impactResults.tsunami.tsunami.damage_level}</p>
                </>
              ) : (
                <p>No tsunami predicted at this location (land or unknown).</p>
              )}
            </div>
          ) : null}
    </div>
  );
};

export default ResultsPanel;
