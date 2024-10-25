import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Routes, Route, Link } from "react-router-dom";
import AdCanvas from "../AdCanvas/AdCanvas";
import AdViewer from "../AdViewer/AdViewer";
import "../../css/index.css";
import layout from "../../layout";

const Ad = () => {
  return (
    <div>
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
            <Route path="/" element={<AdCanvas />} />
            <Route path="/ad-canvas" element={<AdCanvas />} />
            <Route path="/ad-viewer" element={<AdViewer layout={layout} />} />
          </Routes>
        </div>
      </DndProvider>
    </div>
  );
};

export default Ad;
