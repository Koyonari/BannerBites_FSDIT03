import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import TextField from "@mui/material/TextField";
import TVSelector from "../TVSelector";
import AssignLayoutToTV from "../AssignLayoutToTV";

const currencies = [
  {
    value: "date",
    label: "Sort by Date",
  },
  {
    value: "alpha",
    label: "Sort by Alphabetical",
  },
];

const Card = ({ title, date, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="card max-w-96 sm:h-full w-4/5 h-40 bg-black dark:bg-white dark:text-black text-white rounded-xl relative flex flex-col justify-center items-center cursor-pointer hover:opacity-80 transition-opacity"
    >
      <EditIcon className="absolute top-4 right-4 text-white dark:text-black" />
      <div>
        <h1 className="text-md font-bold px-6 py-4 md:px-2">{title}</h1>
        <p className="text-xs px-6 py-4 md:px-2">Date Created: {date}</p>
      </div>
    </div>
  );
};

const UserHome = ({ onSelectLocation, onSelectTV }) => {
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
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
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <section className="bg-white dark:bg-black min-h-screen">
        <Navbar />
        <div className="p-4">
          <button
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            ← Back to TV Selection
          </button>
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
      <section className="bg-white dark:bg-black min-h-screen">
        <Navbar />
        <div className="p-4">
          <button
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            ← Back to Locations
          </button>
          <TVSelector
            locationId={selectedLocationId}
            onSelectTV={handleTVSelect}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-black h-screen">
      <Navbar />
      <div className="flex gap-4 justify-center pt-4 md:px-4">
        <div className="flex py-2 px-4 items-center rounded-md w-1/6 border-black dark:border-white border h-12 sm:h-14">
          <TextField
            className="w-full dark:text-white"
            select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            variant="standard"
          >
            {currencies.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div className="w-1/2 rounded-xl z-[-10]">
          <TextField
            className="dark:border-white"
            id="outlined-basic"
            variant="outlined"
            fullWidth
            label="Search location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link key="home" to={"/ad"} className="bg-orange-500 rounded-md">
          <button className="text-xs md:text-base text-white font-bold py-2 px-4 w-1/6 h-12">
            Create New
          </button>
        </Link>
      </div>

      <div className="w-full py-12 px-4 grid gap-4 lg:gap-6 justify-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
