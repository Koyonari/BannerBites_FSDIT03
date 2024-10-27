import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./css/index.css";
import Home from "./components/Home";
import Ad from "./components/Ad/Ad";
import UserHome from "./components/UserHome/UserHome";

// Configure Amplify
const App = () => {
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedTVId, setSelectedTVId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const navigate = useNavigate();

  // Handle selecting a location
  const handleSelectLocation = (locationId) => {
    setSelectedLocationId(locationId);
    setSelectedTVId(null); // Reset TV selection when a new location is selected
    navigate("/tvs");
  };

  // Handle selecting a TV
  const handleSelectTV = (tvId) => {
    setSelectedTVId(tvId);
    navigate("/assign-layout");
  };

  // Handle selecting a layout
  const handleSelectLayout = (layoutId) => {
    setSelectedLayoutId(layoutId);
    setIsSelectorOpen(false);
    navigate("/layout-viewer");
  };

  // Handle opening the layout selector modal
  const handleOpenSelector = () => {
    setIsSelectorOpen(true);
  };

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
