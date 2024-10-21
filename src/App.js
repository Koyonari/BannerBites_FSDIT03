import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdCanvas from './components/AdCanvas/AdCanvas';
import AdViewer from './components/AdViewer/AdViewer';
import './css/index.css';

const App = () => {
  return (
    <Router>
      <DndProvider backend={HTML5Backend}>
        <div className="App">
          <h1>Real-Time Ad Viewer</h1>
          <nav>
            <ul>
              <li>
                <Link to="/ad-canvas">Ad Canvas</Link>
              </li>
              <li>
                <Link to="/ad-viewer">Ad Viewer</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/ad-canvas" element={<AdCanvas />} />
            <Route path="/ad-viewer" element={<AdViewer />} />
            <Route path="/" element={<h2>Welcome to the Ad System</h2>} />
          </Routes>
        </div>
      </DndProvider>
    </Router>
  );
};

export default App;
