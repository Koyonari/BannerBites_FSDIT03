import React from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";
import UserHome from "./components/UserHome/UserHome";
import LayoutList from "./components/LayoutList/LayoutList";
import AdUnit from "./components/AdUnit/AdUnit";
import Login from "./components/Login/Login";
import CustomRole from "./components/CustomRole/CustomRole";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ad/*" element={<Ad />} />
      <Route path="/userhome/*" element={<UserHome />} />
      <Route path="/layouts" element={<LayoutList />} />
      <Route path="/adunit" element={<AdUnit />} />
      <Route path="/login" element={<Login />} />
      <Route path="/customrole" element={<CustomRole />} />
    </Routes>
  );
};

export default App;
