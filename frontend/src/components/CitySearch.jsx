import React, { useState } from 'react';
import cities from '../cities500.json'; // your JSON file

const CitySearch = ({ setSelectedCity }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    const filtered = cities
      .filter((city) =>
        city.name.toLowerCase().startsWith(value.toLowerCase())
      )
      .slice(0, 10);

    setResults(filtered);
  };

  const handleSelect = (city) => {
    setSelectedCity({
      name: city.name,
      lat: parseFloat(city.lat),
      lon: parseFloat(city.lon),
      population: parseInt(city.pop, 10),
    });
    setQuery(city.name);
    setResults([]);
  };

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto 1rem auto',
        position: 'relative',
      }}
    >
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search for a city..."
        style={{ width: '100%', padding: '0.5rem' }}
      />
      {results.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '0.5rem',
            border: '1px solid #ccc',
            position: 'absolute',
            width: '100%',
            background: 'white',
            zIndex: 1000,
          }}
        >
          {results.map((city) => (
            <li
              key={city.id}
              onClick={() => handleSelect(city)}
              style={{ cursor: 'pointer', padding: '0.25rem 0' }}
            >
              {city.name}, {city.admin1} ({city.country})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CitySearch;
