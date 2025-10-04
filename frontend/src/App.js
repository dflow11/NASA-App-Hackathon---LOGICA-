import React, { useState, useEffect } from 'react';
import AsteroidForm from './components/AsteroidForm';
import ImpactMap from './components/ImpactMap';
import ResultsPanel from './components/ResultsPanel';
import DeflectionPanel from './components/DeflectionPanel';
import './App.css';

function App() {
  const [asteroidData, setAsteroidData] = useState(null); // initially null
  const [originalImpactLocation, setOriginalImpactLocation] = useState(null);
  const [impactLocation, setImpactLocation] = useState(null);
  const [impactResults, setImpactResults] = useState(null);
  const [deltaV, setDeltaV] = useState(0);

  // Calculate impact using selected asteroid's real properties
  const calculateImpact = (data) => {
    if (!data) return null;
  
    const sizeKm = data.size; // already in km
    const velocityKps = data.velocity;
  
    // crude scaling for MVP visualization
    const craterKm = sizeKm * 10;         // 1 km asteroid → 10 km crater
    const blastKm = sizeKm * 50;          // 1 km asteroid → 50 km blast radius
    const energyMegatons = sizeKm * velocityKps * 0.01;
  
    return {
      crater_km: craterKm,
      blast_radius_km: blastKm,
      energy_megatons: energyMegatons,
    };
  };
  

  // Update deflected impact location when deltaV changes
  useEffect(() => {
    if (originalImpactLocation) {
      const deflectedLng = originalImpactLocation[1] + deltaV * 0.5; // simple deflection
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
        <AsteroidForm asteroidData={asteroidData || {}} setAsteroidData={setAsteroidData} />
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
