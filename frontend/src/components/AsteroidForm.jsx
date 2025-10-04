import React from 'react';

const AsteroidForm = ({ neos, asteroidData, setAsteroidData }) => {
  const handleSelect = (e) => {
    const selectedId = e.target.value;
    const selectedNeo = neos.find((n) => n.id === selectedId);

    if (selectedNeo) {
      setAsteroidData({
        id: selectedNeo.id,
        name: selectedNeo.name,
        size: selectedNeo.estimated_diameter_km.estimated_diameter_max,
        velocity: parseFloat(selectedNeo.relative_velocity_kps),
        miss_distance: parseFloat(selectedNeo.miss_distance_km),
      });
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      {neos.length === 0 ? (
        <p>Loading asteroids...</p>
      ) : (
        <label>
          Select Asteroid:
          <select value={asteroidData.id || ''} onChange={handleSelect}>
            <option value="" disabled>
              -- Choose an asteroid --
            </option>
            {neos.map((neo) => (
              <option key={neo.id} value={neo.id}>
                {neo.name} (Mag: {neo.absolute_magnitude})
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};

export default AsteroidForm;