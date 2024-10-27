import React from "react";
import { Routes, Route } from "react-router-dom"; // Removed BrowserRouter import
import "./index.css";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";
import UserHome from "./components/UserHome/UserHome";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ad/*" element={<Ad />} />
      <Route path="/userhome/*" element={<UserHome />} />
    </Routes>
  );
};

export default App;
