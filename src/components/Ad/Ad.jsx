import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Routes, Route } from "react-router-dom";
import AdCanvas from "../AdCanvas/AdCanvas";
import AdViewer from "../AdViewer/AdViewer";
import LayoutViewer from "../AdViewer/LayoutViewer";
import LocationSelector from "../LocationSelector";
import TVSelector from "../TVSelector";
import AssignLayoutTab from "../AssignLayoutTab";
import ErrorBoundary from "../ErrorBoundary";
import Navbar from "../Navbar";

const Ad = () => {
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedTVId, setSelectedTVId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Handle selecting a location
  const handleSelectLocation = (locationId) => {
    setSelectedLocationId(locationId);
    setSelectedTVId(null);
  };

  // Handle selecting a TV
  const handleSelectTV = (tvId) => {
    setSelectedTVId(tvId);
  };

  // Handle selecting a layout
  const handleSelectLayout = (layoutId) => {
    setSelectedLayoutId(layoutId);
    setIsSelectorOpen(false);
  };

  return (
    <div>
      <Navbar />
      <div className="px-8 dark:dark-bg md:mt-[-7.5vh] lg:mt-[-10vh]">
        <ErrorBoundary>
          <DndProvider backend={HTML5Backend}>
            <div>
              <Routes>
                <Route path="/" element={<AdCanvas />} />
                <Route path="ad-canvas" element={<AdCanvas />} />
                <Route path="ad-viewer" element={<AdViewer />} />
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
                />
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
              </Routes>
            </div>
          </DndProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Ad;
