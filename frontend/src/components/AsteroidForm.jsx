// import React from 'react';

// const AsteroidForm = ({ asteroidData, setAsteroidData }) => {
//   return (
//     <form style={{ marginBottom: '1rem' }}>
//       <label>
//         Size (m):
//         <input
//           type="number"
//           value={asteroidData.size}
//           onChange={(e) => setAsteroidData({ ...asteroidData, size: e.target.value })}
//         />
//       </label>
//       <label style={{ marginLeft: '1rem' }}>
//         Velocity (km/s):
//         <input
//           type="number"
//           value={asteroidData.velocity}
//           onChange={(e) => setAsteroidData({ ...asteroidData, velocity: e.target.value })}
//         />
//       </label>
//     </form>
//   );
// };

// export default AsteroidForm;

import React, { useEffect, useState } from 'react';
import { fetchNEOs } from '../api'; // your API helper

const AsteroidForm = ({ asteroidData, setAsteroidData }) => {
  const [neos, setNeos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNEOs()
      .then((data) => {
        setNeos(data);
        if (!asteroidData && data.length > 0) { // only if no selection yet
          const firstNeo = data[0];
          setAsteroidData({
            id: firstNeo.id.toString(),
            name: firstNeo.name,
            size: firstNeo.estimated_diameter_km.estimated_diameter_max,
            velocity: parseFloat(firstNeo.relative_velocity_kps),
            miss_distance: parseFloat(firstNeo.miss_distance_km),
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch NEOs:', err);
        setLoading(false);
      });
  }, [setAsteroidData, asteroidData]);  

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
      {loading ? (
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
