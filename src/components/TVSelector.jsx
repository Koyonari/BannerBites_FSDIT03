import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TVSelector = ({ locationId, onSelectTV }) => {
  const [tvs, setTVs] = useState([]);

  useEffect(() => {
    if (locationId) {
      axios.get(`http://localhost:5000/api/locations/${locationId}/tvs`)
        .then(response => setTVs(response.data))
        .catch(error => console.error('Error fetching TVs:', error));
    }
  }, [locationId]);

  return (
    <div className="tv-selector">
      <h2>Select a TV</h2>
      <ul>
        {tvs.map(tv => (
          <li key={tv.tvId}>
            <button onClick={() => onSelectTV(tv.tvId)}>
              {tv.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TVSelector;
