import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./css/index.css";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";
import UserHome from "./components/UserHome/UserHome";

// Configure Amplify
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ad/*" element={<Ad />} />
        <Route path="/userhome/*" element={<UserHome />} />
      </Routes>
    </Router>
  );
};

export default App;
