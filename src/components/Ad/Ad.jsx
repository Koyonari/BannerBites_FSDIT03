import layout from "../../layout";
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import AdCanvas from "../AdCanvas/AdCanvas";
import AdViewer from "../AdViewer/AdViewer";
import LayoutViewer from "../AdViewer/LayoutViewer";
import LocationSelector from "../LocationSelector";
import TVSelector from "../TVSelector";
import AssignLayoutTab from "../AssignLayoutTab";
import LayoutSelector from "../AdViewer/LayoutSelector"; // Import the missing LayoutSelector component
import ErrorBoundary from "../ErrorBoundary";
import Navbar from "../Navbar";
import { Check, MoveLeft, Merge } from "lucide-react";

const Ad = () => {
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

  // Handle going to the previous page
  const handleMoveLeft = () => {
    navigate(-1);
  };

  return (
    <div>
      <Navbar />
      <div className="px-8 pt-8">
        <ErrorBoundary>
          <DndProvider backend={HTML5Backend}>
            <div className="App">
              <Routes>
                <Route path="/" element={<AdCanvas />} />
                <Route path="ad-canvas" element={<AdCanvas />} />
                <Route
                  path="ad-viewer"
                  element={<AdViewer layout={layout} />}
                />
                <Route
                  path="/locations"
                  element={
                    <LocationSelector onSelectLocation={handleSelectLocation} />
                  }
                />
                <Route
                  path="/tvs"
                  element={
                    selectedLocationId ? (
                      <TVSelector
                        locationId={selectedLocationId}
                        onSelectTV={handleSelectTV}
                      />
                    ) : (
                      <h2>Please select a location first</h2>
                    )
                  }
                />{" "}
                <Route
                  path="/assign-layout"
                  element={
                    selectedTVId ? (
                      <AssignLayoutTab tvId={selectedTVId} />
                    ) : (
                      <h2>Please select a TV first</h2>
                    )
                  }
                />
                <Route
                  path="/layout-viewer"
                  element={<LayoutViewer layoutId={selectedLayoutId} />}
                />
                <Route path="/ad-viewer" element={<AdViewer />} />
              </Routes>
            </div>
            {isSelectorOpen && (
              <LayoutSelector
                onSelect={handleSelectLayout}
                onClose={() => setIsSelectorOpen(false)}
              />
            )}
          </DndProvider>
        </ErrorBoundary>
        <div className="flex flex-row justify-between py-4 lg:py-8 w-4/5 mx-auto">
          <MoveLeft
            onClick={handleMoveLeft}
            className="h-8 text-white bg-orange-500 rounded-lg py-1 w-24 hover:cursor-pointer"
          />
          <Merge className="h-8 text-white bg-orange-500 rounded-lg py-2 w-24 hover:cursor-pointer" />
          <Link to="ad-viewer" onClick={handleOpenSelector}>
            <Check className="h-8 text-white bg-orange-500 rounded-lg py-1.5 w-24" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Ad;
