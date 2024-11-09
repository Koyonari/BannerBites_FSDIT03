import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import TVSelector from "../TVSelector";
import AssignLayoutToTV from "../AssignLayoutToTV";
import { MoveLeft } from "lucide-react";

const sortOptions = [
  { value: "alpha", label: "Sort by Alphabetical" },
  { value: "date", label: "Sort by Date" },
];

const Card = ({ title, date, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="card relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-orange-500 bg-black text-center text-white transition-all duration-300 ease-in-out hover:-translate-y-2 hover:bg-orange-500 hover:shadow-xl dark:bg-white dark:text-black sm:h-full lg:h-[35vh] lg:w-[28vw]"
    >
      <div>
        <h1 className="text-md px-6 py-4 font-bold sm:text-xl md:px-2 lg:text-2xl 2xl:text-4xl">
          {title}
        </h1>
        <p className="text-md sm:text-md px-6 py-4 text-sm md:px-2 lg:text-xl 2xl:text-2xl">
          Date Created: {date}
        </p>
      </div>
    </div>
  );
};

const UserHome = ({ onSelectLocation, onSelectTV }) => {
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("alpha");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [showTVSelector, setShowTVSelector] = useState(false);
  const [selectedTVId, setSelectedTVId] = useState(null);
  const [showLayoutAssignment, setShowLayoutAssignment] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/locations")
      .then((response) => setLocations(response.data))
      .catch((error) => console.error("Error fetching locations:", error));
  }, []);

  const handleLocationSelect = (locationId) => {
    setSelectedLocationId(locationId);
    setShowTVSelector(true);
    if (onSelectLocation) {
      onSelectLocation(locationId);
    }
  };

  const handleTVSelect = (tvId) => {
    setSelectedTVId(tvId);
    setShowLayoutAssignment(true);
    if (onSelectTV) {
      onSelectTV(tvId);
    }
  };

  const handleBack = () => {
    if (showLayoutAssignment) {
      setShowLayoutAssignment(false);
      setSelectedTVId(null);
    } else {
      setShowTVSelector(false);
      setSelectedLocationId(null);
    }
  };

  const handleLayoutAssigned = () => {
    setShowLayoutAssignment(false);
    setShowTVSelector(false);
    setSelectedTVId(null);
    setSelectedLocationId(null);
  };

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (sortBy === "alpha") {
      return a.name.localeCompare(b.name);
    } else {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    }
  });

  if (showLayoutAssignment) {
    return (
      <section className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="p-4">
          <MoveLeft
            onClick={handleBack}
            className="h-8 w-16 rounded-lg bg-gray-500 py-1 text-white transition-all duration-300 ease-in-out hover:cursor-pointer hover:bg-orange-500 sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
          />
          <AssignLayoutToTV
            tvId={selectedTVId}
            onLayoutAssigned={handleLayoutAssigned}
          />
        </div>
      </section>
    );
  }

  if (showTVSelector) {
    return (
      <section className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="p-4">
          <MoveLeft
            onClick={handleBack}
            className="h-8 w-16 rounded-lg bg-gray-500 py-1 text-white transition-all duration-300 ease-in-out hover:cursor-pointer hover:bg-orange-500 sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
          />
          <TVSelector
            locationId={selectedLocationId}
            onSelectTV={handleTVSelect}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="h-screen bg-white dark:bg-black">
      <Navbar />
      <div className="flex h-12 justify-center gap-4 pt-4 md:px-4 xl:h-24">
        <div className="flex h-full w-1/6 items-center rounded-md border border-gray-300 px-4 py-2 lg:text-xl xl:text-2xl">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-transparent text-black focus:outline-none dark:bg-black dark:text-white"
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                className="dark:text-black"
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex h-full w-1/2 items-center rounded-md border border-gray-300 px-4 py-2 dark:border-white">
          <input
            type="text"
            placeholder="Search location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-black placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400 lg:text-xl xl:text-2xl"
          />
        </div>
        <Link key="home" to={"/ad"} className="w-1/6">
          <button className="h-full w-full rounded-md bg-orange-500 px-4 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-orange-600 md:text-base lg:text-xl xl:text-2xl">
            Create New
          </button>
        </Link>
      </div>

      <div className="grid w-full grid-cols-1 justify-items-center gap-4 px-16 py-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {sortedLocations.map((location) => (
          <Card
            key={location.locationId}
            title={location.name}
            date={new Date(location.dateCreated).toLocaleDateString()}
            onClick={() => handleLocationSelect(location.locationId)}
          />
        ))}
      </div>
    </section>
  );
};

export default UserHome;
