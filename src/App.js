import React from "react";
import { Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";
import UserHome from "./components/UserHome/UserHome";
import LayoutList from "./components/LayoutList/LayoutList";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ad/*" element={<Ad />} />
      <Route path="/userhome/*" element={<UserHome />} />
      <Route path="/layouts" element={<LayoutList />} />
    </Routes>
  );
};

export default App;
