import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Route, Routes, Link, useNavigate } from 'react-router-dom';
import AdCanvas from './components/AdCanvas/AdCanvas';
import AdViewer from './components/AdViewer/AdViewer';
import LayoutSelector from './components/AdViewer/LayoutSelector'; 
import LayoutViewer from './components/AdViewer/LayoutViewer';     
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const navigate = useNavigate();

  const handleSelectLayout = (layoutId) => {
    setSelectedLayoutId(layoutId);
    setIsSelectorOpen(false);
    navigate('/layout-viewer');
  };

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
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<h2>Welcome to the Ad System</h2>} />
            <Route path="/ad-canvas" element={<AdCanvas />} />
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
