import React, { useState, useEffect } from "react";
import axios from "axios";

const TVSelector = ({ locationId, onSelectTV }) => {
  const [tvs, setTVs] = useState([]);

  useEffect(() => {
    if (locationId) {
      axios
        .get(`http://localhost:5000/api/locations/${locationId}/tvs`)
        .then((response) => setTVs(response.data))
        .catch((error) => console.error("Error fetching TVs:", error));
    }
  }, [locationId]);

  return (
    <div className="tv-selector h-full w-full">
      <h2 className="mb-12 text-center text-5xl font-bold">Televisions</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tvs.map((tv) => (
          <li key={tv.tvId} className="flex justify-center">
            <button
              onClick={() => onSelectTV(tv.tvId)}
              className="h-[24vh] w-full max-w-xs rounded-lg border-2 border-orange-500 bg-black text-lg text-white shadow-md transition-all duration-300 ease-in-out hover:-translate-y-2 hover:bg-orange-600 hover:shadow-xl"
            >
              {tv.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TVSelector;
