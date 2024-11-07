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
      className="card relative flex w-4/5 max-w-96 cursor-pointer flex-col items-center justify-center rounded-xl bg-black text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black sm:h-full lg:h-[35vh] lg:w-[28vw]"
    >
      <EditIcon className="absolute right-4 top-4 text-white dark:text-black" />
      <div>
        <h1 className="px-6 py-4 text-xl font-bold md:px-2">{title}</h1>
        <p className="text-md px-6 py-4 md:px-2">Date Created: {date}</p>
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
          <button
            onClick={handleBack}
            className="mb-4 rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
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
      <section className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="p-4">
          <button
            onClick={handleBack}
            className="mb-4 rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
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
    <section className="h-screen bg-white dark:bg-black">
      <Navbar />
      <div className="flex justify-center gap-4 pt-4 md:px-4">
        <div className="flex h-12 w-1/6 items-center rounded-md border border-[#0000003a] px-4 py-2 dark:border-white sm:h-14">
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
        <div className="flex h-12 w-1/2 items-center rounded-md px-4 py-2 sm:h-14">
          <TextField
            id="outlined-basic"
            variant="outlined"
            fullWidth
            label="Search location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link key="home" to={"/ad"} className="w-1/6 rounded-md bg-orange-500">
          <button className="h-full w-full px-4 py-2 text-center text-xs font-bold text-white md:text-base">
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
