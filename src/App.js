import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ad/*" element={<Ad />} />
      </Routes>
    </Router>
  );
};

export default App;
