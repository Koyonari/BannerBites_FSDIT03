import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";

const AdUnit = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen light-bg dark:dark-bg">
      <Navbar />
      <div className="mx-auto flex w-full flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12 lg:px-16 lg:text-lg xl:h-20 xl:px-24 2xl:px-32">
        {/* Search Bar */}
        <div className="w-full sm:w-3/4">
          <div className="relative h-10 rounded-lg border secondary-border lg:h-16 xl:h-20">
            <input
              type="text"
              placeholder="Search advertisements"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-full w-full rounded-lg bg-transparent px-3 text-sm primary-text placeholder-primary focus:outline-none dark:secondary-text dark:placeholder-secondary sm:text-base lg:text-lg xl:text-2xl"
            />
          </div>
        </div>

        {/* Create New Button */}
        <div className="w-full sm:w-1/5">
          <Link to="/ad">
            <button className="primary-bg hover:secondary-bg h-10 w-full rounded-lg text-sm font-bold transition-colors secondary-text lg:h-16 lg:text-lg xl:h-20 xl:text-2xl">
              Create New
            </button>
          </Link>
        </div>
      </div>

      <div className="px-4">
        <h2 className="text-white">Ad Unit</h2>
      </div>
    </div>
  );
};

export default AdUnit;
