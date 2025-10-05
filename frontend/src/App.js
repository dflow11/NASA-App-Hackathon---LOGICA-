import React, { useState, useEffect, useCallback } from 'react';
import AsteroidForm from './components/AsteroidForm';
import CitySearch from './components/CitySearch';
import ImpactMap from './components/ImpactMap';
import ResultsPanel from './components/ResultsPanel';
import DeflectionPanel from './components/DeflectionPanel';
import { fetchNEOs } from './api'; // your API helper
import './css/App.css';

function App() {
  const [asteroidData, setAsteroidData] = useState(null); // selected asteroid
  const [selectedCity, setSelectedCity] = useState(null); // city selection
  const [originalImpactLocation, setOriginalImpactLocation] = useState(null); // raw impact
  const [neos, setNeos] = useState([]);
  const [impactLocation, setImpactLocation] = useState(null); // deflected location
  const [impactResults, setImpactResults] = useState(null);
  const [deltaLng, setDeltaLng] = useState(0); // longitude deflection
  const [deltaLat, setDeltaLat] = useState(0); // latitude deflection

  // Fetch NEOs on load
  useEffect(() => {
    fetchNEOs()
      .then((data) => {
        setNeos(data);
        if (data.length > 0) {
          const firstNeo = data[0];
          // Safely access nested properties
          setAsteroidData({
            id: firstNeo.id.toString(),
            name: firstNeo.name,
            size: firstNeo.estimated_diameter_km?.estimated_diameter_max || 0,
            velocity: parseFloat(firstNeo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second) || 0,
          });
        }
      })
      .catch((err) => console.error('Failed to fetch NEOs:', err));
  }, []);

  // Calculate impact using asteroid properties, optionally with city data
  const calculateImpact = useCallback((asteroid, city = null) => {
    if (!asteroid) return null;

    const sizeKm = asteroid.size;
    const velocityKps = asteroid.velocity;

    // MVP scaling
    const craterKm = sizeKm * 10;
    const blastKm = sizeKm * 50;
    const energyMegatons = sizeKm * velocityKps * 0.01;

    // Rough casualties if a real city is selected
    let casualties = null;
    if (city && city.population) {
      const pop = parseInt(city.population, 10);
      const affectedFraction = Math.min(1, blastKm / 50);
      casualties = Math.round(pop * affectedFraction);
    }

    return { crater_km: craterKm, blast_radius_km: blastKm, energy_megatons: energyMegatons, casualties };
  }, []);

  // When user selects a city
  useEffect(() => {
    if (selectedCity && asteroidData) {
      const latlng = [parseFloat(selectedCity.lat), parseFloat(selectedCity.lon)];
      setOriginalImpactLocation(latlng);
      setImpactResults(calculateImpact(asteroidData, selectedCity));
      setDeltaLng(0);
      setDeltaLat(0);
    }
  }, [selectedCity, asteroidData, calculateImpact]);

  // Update deflected impact location based on deltaLat/deltaLng
  useEffect(() => {
    if (originalImpactLocation) {
      setImpactLocation([
        originalImpactLocation[0] + deltaLat,
        originalImpactLocation[1] + deltaLng,
      ]);
    }
  }, [deltaLat, deltaLng, originalImpactLocation]);

  // Map click handler for non-city locations
  const handleMapClick = (latlng) => {
    setSelectedCity(null);
    setOriginalImpactLocation(latlng);
    setImpactResults(calculateImpact(asteroidData, null)); // no casualties
    setDeltaLng(0);
    setDeltaLat(0);
  };

  return (
    <div className="App">
      <header>
        <h1>Asteroid Impact Simulator (MVP)</h1>
      </header>
      <main>
        <AsteroidForm neos={neos} asteroidData={asteroidData || {}} setAsteroidData={setAsteroidData} />
        <CitySearch selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <DeflectionPanel
          deltaLng={deltaLng} setDeltaLng={setDeltaLng}
          deltaLat={deltaLat} setDeltaLat={setDeltaLat}
        />
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
