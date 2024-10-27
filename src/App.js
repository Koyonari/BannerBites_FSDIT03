import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import AdCanvas from './components/AdCanvas/AdCanvas';
import AdViewer from "./components/AdViewer/AdViewer";
import LayoutViewer from "./components/AdViewer/LayoutViewer";
import LocationSelector from './components/LocationSelector';
import TVSelector from './components/TVSelector';
import AssignLayoutTab from './components/AssignLayoutTab';
import LayoutSelector from './components/AdViewer/LayoutSelector';  // Import the missing LayoutSelector component
import ErrorBoundary from './components/ErrorBoundary';

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
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        <div className="App">
          <h1>Real-Time Ad Viewer</h1>
          <nav>
            <ul>
              <li>
                <Link to="/ad-canvas">Ad Canvas</Link>
              </li>
              <li>
                <button onClick={handleOpenSelector}>Ad Viewer</button>
              </li>
              <li>
                <Link to="/locations">Manage Locations</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<h2>Welcome to the Ad System</h2>} />
            <Route path="/ad-canvas" element={<AdCanvas />} />
            <Route
              path="/locations"
              element={<LocationSelector onSelectLocation={handleSelectLocation} />}
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
  );
};

export default App;
