import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import AdCanvas from "./components/AdCanvas/AdCanvas";
import AdViewer from "./components/AdViewer/AdViewer";
import "./css/index.css";
import layout from "./layout";
import ErrorBoundary from "./components/ErrorBoundary";

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
