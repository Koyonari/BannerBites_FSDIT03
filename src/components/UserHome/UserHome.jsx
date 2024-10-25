import Navbar from "../Navbar";
import TextField from "@mui/material/TextField";
import React from "react";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";

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

const UserHome = () => {
  return (
    <section className="bg-white dark:bg-black h-screen">
      <Navbar />
      <div className="flex gap-4 justify-center pt-4 px-4">
        <div className="flex py-2 px-4 items-center rounded-md w-1/6 border-black border">
          <TextField
            className="w-full"
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

        <div className="w-1/2 rounded-xl">
          <TextField
            id="outlined-basic"
            variant="outlined"
            fullWidth
            label="Search location"
          />
        </div>

        <button className="bg-orange-500 text-white font-bold py-2 px-4 w-1/6 rounded-md h-14">
          Create New
        </button>
      </div>

      {/* Cards */}
      <div className="w-full py-12 px-4 h-full grid gap-6">
        <div className="card max-w-96 h-1/5 bg-black dark:bg-white dark:text-black text-white rounded-md relative flex flex-col justify-center items-center">
          <EditIcon className="absolute top-4 right-4 text-white dark:text-black" />
          <div>
            <h1 className="text-lg font-bold px-6 py-4">Clementi</h1>
            <p className="text-sm px-6 py-4">Date Created: 28 October 2024</p>
          </div>
        </div>

        <div className="card max-w-96 h-1/5 bg-black dark:bg-white dark:text-black text-white rounded-md relative flex flex-col justify-center items-center">
          <EditIcon className="absolute top-4 right-4 text-white dark:text-black" />
          <div>
            <h1 className="text-lg font-bold px-6 py-4">Clementi</h1>
            <p className="text-sm px-6 py-4">Date Created: 28 October 2024</p>
          </div>
        </div>

        <div className="card max-w-96 h-1/5 bg-black dark:bg-white dark:text-black text-white rounded-md relative flex flex-col justify-center items-center">
          <EditIcon className="absolute top-4 right-4 text-white dark:text-black" />
          <div>
            <h1 className="text-lg font-bold px-6 py-4">Clementi</h1>
            <p className="text-sm px-6 py-4">Date Created: 28 October 2024</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserHome;
