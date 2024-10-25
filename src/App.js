// App.js
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AdCanvas from './components/AdCanvas/AdCanvas';
import AdViewer from './components/AdViewer/AdViewer';
import './css/index.css';
import layout from './layout'; 
import { Amplify } from 'aws-amplify';
import awsConfig from './services/aws-exports';
import ErrorBoundary from './components/ErrorBoundary';

try {
  Amplify.configure({
    ...awsConfig,
    Storage: {
      AWSS3: {
        bucket: awsConfig.aws_user_files_s3_bucket,
        region: awsConfig.aws_user_files_s3_bucket_region,
      },
    },
  });
  console.log('Amplify configured successfully.');
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

const App = () => {
  return (
    <ErrorBoundary>
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
              <Route path="/ad-viewer" element={<AdViewer layout={layout} />} />
              <Route path="/" element={<h2>Welcome to the Ad System</h2>} />
            </Routes>
          </div>
        </DndProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
