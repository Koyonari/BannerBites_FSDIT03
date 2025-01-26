import React, { useState, useEffect } from "react";
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

import { getPermissionsFromToken} from "../../utils/permissionsUtils";
import Cookies from "js-cookie";

const Ad = () => {
  const [selectedLayoutId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedTVId, setSelectedTVId] = useState(null);

  const [permissions, setPermissions] = useState({});
    
      useEffect(() => {
        // Fetch permissions whenever the token changes
        const token = Cookies.get("authToken");
        if (token) {
          getPermissionsFromToken(token).then(setPermissions);
        } else {
          console.warn("No auth token found.");
          setPermissions({});
        }
      }, []); // Runs only once when the component mounts
    

  

  // Handle selecting a location
  const handleSelectLocation = (locationId) => {
    setSelectedLocationId(locationId);
    setSelectedTVId(null);
  };

  // Handle selecting a TV
  const handleSelectTV = (tvId) => {
    setSelectedTVId(tvId);
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
