import React, { useEffect } from 'react';

const GazeTrackingComponent = ({ onGazeAtAd, isActive }) => {
  useEffect(() => {
    let webgazerInstance = null;

    if (isActive) {
      import('webgazer')
        .then((module) => {
          webgazerInstance = module.default;
          webgazerInstance
            .setGazeListener((data, elapsedTime) => {
              if (data) onGazeAtAd(data);
            })
            .begin();
        })
        .catch((error) => {
          console.error('Error loading WebGazer:', error);
        });
    }

    return () => {
      if (webgazerInstance) {
        webgazerInstance.clearGazeListener();
        webgazerInstance.end();
      }
    };
  }, [isActive, onGazeAtAd]);

  return null;
};

export default GazeTrackingComponent;
