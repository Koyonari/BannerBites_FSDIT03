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
<<<<<<< HEAD
    <div className="tv-selector">
      <h2>Select a TV</h2>
      <ul>
        {tvs.map((tv) => (
          <li key={tv.tvId}>
            <button onClick={() => onSelectTV(tv.tvId)}>{tv.name}</button>
=======
    <div className="tv-selector h-full w-full pl-8 pr-8">
      <h2 className="mb-12 text-center text-5xl font-bold primary-text dark:secondary-text xl:text-7xl">
        Televisions
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tvs.map((tv) => (
          <li key={tv.tvId} className="flex justify-center">
            <button
              onClick={() => onSelectTV(tv.tvId)}
              className="primary-bg h-[24vh] w-full max-w-lg rounded-lg border-2 text-lg font-bold shadow-md transition-all duration-300 ease-in-out primary-border primary-text hover:-translate-y-2 hover:shadow-xl hover:secondary-text dark:dark-bg dark:secondary-text lg:text-2xl xl:h-[30vh] xl:max-w-xl xl:text-4xl"
            >
              {tv.name}
            </button>
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TVSelector;
