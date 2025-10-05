import React, { useState, useEffect, useCallback } from 'react';
import AsteroidForm from './components/AsteroidForm';
import CitySearch from './components/CitySearch';
import ImpactMapWrapper from './components/ImpactMap';
import ResultsPanel from './components/ResultsPanel';
import DeflectionPanel from './components/DeflectionPanel';
import DeflectionControls from './components/DeflectionControls';
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
  const [mapZoom, setMapZoom] = useState(4); // Add state for map zoom
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Fetching Near-Earth Objects from NASA...');

  // Fetch NEOs on load
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNEOs()
      .then((data) => {
        setNeos(data);
        if (data.length > 0) {
          setStatusMessage('Data loaded. Select a city or click on the map to begin.');
          const firstNeo = data[0];
          // Safely access nested properties
          setAsteroidData({
            id: firstNeo.id.toString(),
            name: firstNeo.name,
            size: firstNeo.estimated_diameter_km?.estimated_diameter_max || 0,
            velocity: parseFloat(firstNeo.relative_velocity_kps) || 0,
            miss_distance: parseFloat(firstNeo.miss_distance_km) || 0,
            close_approach_date: firstNeo.close_approach_date || firstNeo.close_approach_date_full || null,
          });
        } else {
          setStatusMessage('No NEO data available at the moment.');
          setError('No near-earth objects were returned by the API.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch data from the backend. Is the Flask server running?');
        setLoading(false);
      });
  }, []);

  // Calculate impact using asteroid properties, optionally with city data
  const calculateImpact = useCallback((asteroid, city = null) => {
    if (!asteroid) return null;

    const sizeKm = asteroid.size;
    const velocityKps = asteroid.velocity;

    // --- Improved Physics Calculation ---
    // Constants
    const DENSITY_ASTEROID_KGM3 = 2700; // Average density of a stony asteroid
    const JOULES_PER_MEGATON_TNT = 4.184e15;

    // Calculations
    const sizeM = sizeKm * 1000;
    const velocityMps = velocityKps * 1000;
    const massKg = (4/3) * Math.PI * Math.pow(sizeM / 2, 3) * DENSITY_ASTEROID_KGM3;
    const energyJoules = 0.5 * massKg * Math.pow(velocityMps, 2);
    const energyMegatons = energyJoules / JOULES_PER_MEGATON_TNT;

    // Scaling laws for effects (simplified from scientific models)
    // Define multiple rings of destruction
    const energyCubeRoot = Math.pow(energyMegatons, 1/3);
    const craterKm = 1.5 * energyCubeRoot;
    const severeBlastKm = 5 * energyCubeRoot;
    const moderateBlastKm = 15 * energyCubeRoot;
    const lightBlastKm = 40 * energyCubeRoot;
    // --- End of Improved Calculation ---

    // Rough casualties if a real city is selected
    let casualties = null;
    if (city && city.population) {
      const pop = parseInt(city.population, 10);
      const affectedFraction = Math.min(1, severeBlastKm / 50); // Base casualties on severe blast zone
      casualties = Math.round(pop * affectedFraction);
    }

    return {
      crater_km: craterKm,
      blast_radius_km: severeBlastKm, // Add this back for compatibility
      severe_blast_km: severeBlastKm,
      moderate_blast_km: moderateBlastKm,
      light_blast_km: lightBlastKm,
      energy_megatons: energyMegatons,
      casualties
    };
  }, []);

  // When user selects a city
  useEffect(() => {
    if (selectedCity && asteroidData) {
      const latlng = [parseFloat(selectedCity.lat), parseFloat(selectedCity.lon)];
      setOriginalImpactLocation(latlng);
      setImpactResults(calculateImpact(asteroidData, selectedCity));
      setDeltaLng(0);
      setDeltaLat(0);
      setMapZoom(7); // Zoom in when a new city is selected
    }
  }, [selectedCity, asteroidData, calculateImpact]);

  // When user selects a new asteroid, recalculate impact for the current location
  useEffect(() => {
    // Only recalculate if there's already an impact location set
    if (originalImpactLocation && asteroidData) {
      const baseResults = calculateImpact(asteroidData, selectedCity);
      setImpactResults(baseResults);

      // Call backend /tsunami endpoint to check water and estimate tsunami
      (async () => {
        try {
          const resp = await fetch('http://localhost:5000/tsunami', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: originalImpactLocation[0],
              lon: originalImpactLocation[1],
              energy_megatons: baseResults.energy_megatons
            })
          });
          if (resp.ok) {
            const js = await resp.json();
            // Attach tsunami info to impactResults
            setImpactResults((prev) => ({ ...prev, tsunami: js }));
          }
        } catch (e) {
          // ignore errors for now
          console.warn('Failed to fetch tsunami data', e);
        }
      })();
    }
  }, [asteroidData, originalImpactLocation, selectedCity, calculateImpact]);

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
    const baseResults = calculateImpact(asteroidData, null); // no casualties
    setImpactResults(baseResults);

    // Immediately request tsunami estimate for clicked location
    (async () => {
      try {
        const resp = await fetch('http://localhost:5000/tsunami', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latlng[0], lon: latlng[1], energy_megatons: baseResults.energy_megatons })
        });
        if (resp.ok) {
          const js = await resp.json();
          setImpactResults((prev) => ({ ...prev, tsunami: js }));
        }
      } catch (e) {
        console.warn('Failed to fetch tsunami on click', e);
      }
    })();
    setDeltaLng(0);
    setDeltaLat(0);
    setMapZoom(null); // Don't force zoom on map click, just pan
  };

  if (loading) {
    return <div className="App-status"><h1>Loading...</h1><p>{statusMessage}</p></div>;
  }

  if (error) {
    return <div className="App-status"><h1>Error</h1><p>{error}</p></div>;
  }

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
        <DeflectionControls asteroidData={asteroidData} />
        <ImpactMapWrapper
          impactLocation={impactLocation}
          impactResults={impactResults}
          mapZoom={mapZoom}
          onMapClick={handleMapClick}
        />
        <ResultsPanel impactResults={impactResults} />
      </main>
    </div>
  );
}

export default App;
