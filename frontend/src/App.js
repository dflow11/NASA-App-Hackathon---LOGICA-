import React, { useState, useEffect } from 'react';
import AsteroidForm from './components/AsteroidForm';
import ImpactMap from './components/ImpactMap';
import ResultsPanel from './components/ResultsPanel';
import DeflectionPanel from './components/DeflectionPanel';
import './App.css';

function App() {
  const [asteroidData, setAsteroidData] = useState({ size: 100, velocity: 20 });
  const [originalImpactLocation, setOriginalImpactLocation] = useState(null); // raw click
  const [impactLocation, setImpactLocation] = useState(null); // deflected location
  const [impactResults, setImpactResults] = useState(null);
  const [deltaV, setDeltaV] = useState(0); // Δv slider

  // Placeholder formulas
  const calculateImpact = (data) => ({
    crater_km: data.size * 0.1,
    blast_radius_km: data.size * 0.5,
    energy_megatons: data.size * data.velocity * 0.01,
  });

  // Recalculate deflected impact location whenever deltaV or originalImpactLocation changes
  useEffect(() => {
    if (originalImpactLocation) {
      const deflectedLng = originalImpactLocation[1] + deltaV * 0.5; // simple deflection simulation
      setImpactLocation([originalImpactLocation[0], deflectedLng]);
    }
  }, [deltaV, originalImpactLocation]);

  const handleMapClick = (latlng) => {
    setOriginalImpactLocation(latlng);
    const results = calculateImpact(asteroidData);
    setImpactResults(results);
  };

  return (
    <div className="App">
      <header>
        <h1>Asteroid Impact Simulator (MVP)</h1>
      </header>
      <main>
        <AsteroidForm asteroidData={asteroidData} setAsteroidData={setAsteroidData} />
        <DeflectionPanel deltaV={deltaV} setDeltaV={setDeltaV} />
        <ImpactMap
          impactLocation={impactLocation}
          impactResults={impactResults}
          onMapClick={handleMapClick}
        />
        <ResultsPanel impactResults={impactResults} />
      </main>
    </div>
  );
}

export default App;
