import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import TextField from "@mui/material/TextField";

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

const Card = ({ title, date }) => {
  return (
    <div className="card max-w-96 sm:h-full w-4/5 h-40 bg-black dark:bg-white dark:text-black text-white rounded-xl relative flex flex-col justify-center items-center">
      <EditIcon className="absolute top-4 right-4 text-white dark:text-black" />
      <div>
        <h1 className="text-md font-bold px-6 py-4 md:px-2">{title}</h1>
        <p className="text-xs px-6 py-4 md:px-2">Date Created: {date}</p>
      </div>
    </div>
  );
};

const UserHome = () => {
  return (
    <section className="bg-white dark:bg-black h-screen">
      <Navbar />
      <div className="flex gap-4 justify-center pt-4 md:px-4">
        <div className="flex py-2 px-4 items-center rounded-md w-1/6 border-black dark:border-white border h-12 sm:h-14">
          <TextField
            className="w-full dark:text-white"
            select
            defaultValue="date"
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
          />
        </div>

        <Link key="home" to={"/ad"} className="bg-orange-500 rounded-md">
          <button className="text-xs md:text-base text-white font-bold py-2 px-4 w-1/6 h-12">
            Create New
          </button>
        </Link>
      </div>

      {/* Cards */}
      <div className="w-full py-12 px-4 grid gap-4 lg:gap-6 justify-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Clementi" date="28 October 2024" />
        <Card title="Orchard" date="15 October 2024" />
        <Card title="Bugis" date="5 October 2024" />
      </div>
    </section>
  );
};

export default UserHome;
