import React, { useState, useEffect } from 'react';
import AsteroidForm from './components/AsteroidForm';
import CitySearch from './components/CitySearch';
import ImpactMap from './components/ImpactMap';
import ResultsPanel from './components/ResultsPanel';
import DeflectionPanel from './components/DeflectionPanel';
import { fetchNEOs } from './api'; // your API helper
import './App.css';

function App() {
  const [asteroidData, setAsteroidData] = useState(null); // selected asteroid
  const [selectedCity, setSelectedCity] = useState(null); // city selection
  const [originalImpactLocation, setOriginalImpactLocation] = useState(null); // raw impact
  const [impactLocation, setImpactLocation] = useState(null); // deflected location
  const [neos, setNeos] = useState([]);
  const [asteroidData, setAsteroidData] = useState(null); // initially null
  const [originalImpactLocation, setOriginalImpactLocation] = useState(null);
  const [impactLocation, setImpactLocation] = useState(null);
  const [impactResults, setImpactResults] = useState(null);
  const [deltaV, setDeltaV] = useState(0); // Δv slider
  const [deltaV, setDeltaV] = useState(0);

  useEffect(() => {
    fetchNEOs()
      .then((data) => {
        setNeos(data);
        if (data.length > 0) {
          const firstNeo = data[0];
          setAsteroidData({
            id: firstNeo.id.toString(),
            name: firstNeo.name,
            size: firstNeo.estimated_diameter_km.estimated_diameter_max,
            velocity: parseFloat(firstNeo.relative_velocity_kps),
            miss_distance: parseFloat(firstNeo.miss_distance_km),
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch NEOs:', err);
      });
  }, []);

  // Calculate impact using asteroid properties, optionally with city data
  const calculateImpact = (asteroid, city = null) => {
    if (!asteroid) return null;

    const sizeKm = asteroid.size; // km
    const velocityKps = asteroid.velocity;

    // Basic MVP scaling
    const craterKm = sizeKm * 10;
    const blastKm = sizeKm * 50;
    const energyMegatons = sizeKm * velocityKps * 0.01;

    // Rough casualty estimate only if a real city is selected
    let casualties = null;
    if (city && city.pop) {
      const pop = parseInt(city.pop, 10) || 0;
      const affectedFraction = Math.min(1, blastKm / 50); 
      casualties = Math.round(pop * affectedFraction);
    }

    return { crater_km: craterKm, blast_radius_km: blastKm, energy_megatons: energyMegatons, casualties };
  };

  // When user selects a city, set original location and impact results
  useEffect(() => {
    if (selectedCity && asteroidData) {
      const latlng = [parseFloat(selectedCity.lat), parseFloat(selectedCity.lon)];
      setOriginalImpactLocation(latlng);
      setImpactResults(calculateImpact(asteroidData, selectedCity));
    }
  }, [selectedCity, asteroidData]);

  // Update deflected impact location when deltaV changes
  useEffect(() => {
    if (originalImpactLocation) {
      const deflectedLng = originalImpactLocation[1] + deltaV * 0.5; // simple longitude shift
      setImpactLocation([originalImpactLocation[0], deflectedLng]);
    }
  }, [deltaV, originalImpactLocation]);

  // Map click handler (for non-city locations)
  const handleMapClick = (latlng) => {
    setSelectedCity(null); // clear city selection
    setOriginalImpactLocation(latlng);
    setImpactResults(calculateImpact(asteroidData, null)); // no casualties
  };

  return (
    <div className="App">
      <header>
        <h1>Asteroid Impact Simulator (MVP)</h1>
      </header>
      <main>
        <AsteroidForm neos={neos} asteroidData={asteroidData || {}} setAsteroidData={setAsteroidData} />
        <AsteroidForm asteroidData={asteroidData || {}} setAsteroidData={setAsteroidData} />
        <CitySearch selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
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