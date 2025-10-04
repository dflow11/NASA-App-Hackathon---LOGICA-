import React from 'react';

const AsteroidForm = ({ asteroidData, setAsteroidData }) => {
  return (
    <form style={{ marginBottom: '1rem' }}>
      <label>
        Size (m):
        <input
          type="number"
          value={asteroidData.size}
          onChange={(e) => setAsteroidData({ ...asteroidData, size: e.target.value })}
        />
      </label>
      <label style={{ marginLeft: '1rem' }}>
        Velocity (km/s):
        <input
          type="number"
          value={asteroidData.velocity}
          onChange={(e) => setAsteroidData({ ...asteroidData, velocity: e.target.value })}
        />
      </label>
    </form>
  );
};

export default AsteroidForm;
