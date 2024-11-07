import React, { useState, useEffect } from "react";
import axios from "axios";

const LocationSelector = ({ onSelectLocation }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/locations")
      .then((response) => setLocations(response.data))
      .catch((error) => console.error("Error fetching locations:", error));
  }, []);

  return (
    <div className="location-selector">
      <h2>Select a Location</h2>
      <ul>
        {locations.map((location) => (
          <li key={location.locationId}>
            <button onClick={() => onSelectLocation(location.locationId)}>
              {location.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationSelector;
