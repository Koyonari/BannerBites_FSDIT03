import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import TVSelector from "../TVSelector";
import AssignLayoutToTV from "../AssignLayoutToTV";
import { MoveLeft } from "lucide-react";

import { getPermissionsFromToken} from "../../utils/permissionsUtils";
import Cookies from "js-cookie";

const sortOptions = [{ value: "alpha", label: "Sort by Alphabetical" }];



const Card = ({ title, date, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="card primary-bg hover:primary-bg dark:hover:primary-bg relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 text-center transition-all duration-300 ease-in-out primary-border primary-text hover:-translate-y-2 hover:shadow-xl hover:secondary-text dark:dark-bg dark:secondary-text dark:hover:secondary-text sm:h-full lg:h-[35vh] lg:w-[28vw] xl:border-4"
    >
      <div>
        <h1 className="text-md px-6 py-4 font-bold sm:text-xl md:px-2 lg:text-2xl 2xl:text-4xl">
          {title}
        </h1>
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

  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // Fetch permissions whenever the token changes
    const token = Cookies.get("authToken");
    if (token) {
      getPermissionsFromToken(token).then(setPermissions);
    } else {
      console.warn("No auth token found.");
      setPermissions({});
    }
  }, []); // Runs only once when the component mounts

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
      <section className="min-h-screen light-bg dark:dark-bg">
        <Navbar />
        <div className="p-4">
          <MoveLeft
            onClick={handleBack}
            className="hover:primary-bg tertiary-bg h-8 w-16 rounded-lg py-1 transition-all duration-300 ease-in-out secondary-text hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
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
      <section className="min-h-screen light-bg dark:dark-bg">
        <Navbar />
        <div className="p-4">
          <MoveLeft
            onClick={handleBack}
            className="hover:primary-bg tertiary-bg h-8 w-16 rounded-lg py-1 transition-all duration-300 ease-in-out secondary-text hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
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
    <section className="min-h-screen light-bg dark:dark-bg">
      <Navbar />
      <div className="mx-auto flex w-full flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32">
        {/* Sort Dropdown */}
        <div className="w-full sm:w-1/6">
          <div className="relative h-10 rounded-lg border secondary-border lg:h-16 xl:h-20">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-full w-full rounded-lg bg-transparent px-3 text-sm focus:outline-none dark:dark-bg dark:secondary-text sm:text-base lg:text-lg xl:text-2xl"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  className="dark:text-gray-200 lg:text-lg xl:text-2xl"
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-3/5">
          <div className="relative h-10 rounded-lg border secondary-border lg:h-16 lg:text-lg xl:h-20 xl:text-2xl">
            <input
              type="text"
              placeholder="Search location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-full w-full rounded-lg bg-transparent px-3 text-sm primary-text placeholder-primary focus:outline-none dark:secondary-text dark:placeholder-secondary sm:text-base lg:h-16 lg:text-lg xl:h-20 xl:text-2xl"
            />
          </div>
        </div>

        {/* Create New Button */}
        <div className="w-full sm:w-1/6">
          
            <Link to="/ad">

              <button className="primary-bg hover:secondary-bg h-10 w-full rounded-lg text-sm font-bold transition-colors secondary-text lg:h-16 lg:text-lg xl:h-20 xl:text-2xl">
                Create New
              </button>

            </Link>
        </div>
      </div>

      {/* Card Component */}
      <div className="grid w-full grid-cols-1 justify-items-center gap-4 px-8 py-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 lg:px-16 xl:px-24 2xl:px-32">
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
