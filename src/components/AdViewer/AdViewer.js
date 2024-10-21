import React, { useEffect, useState } from 'react';
import socket from '../../services/socket';
import './AdViewer.css'; 


const AdViewer = () => {
  const [adData, setAdData] = useState([]);

  useEffect(() => {
    // Listen for ad updates from the backend
    socket.on('updateAds', (newAdData) => {
      setAdData(newAdData);
    });

    // Cleanup listener on component unmount
    return () => {
      socket.off('updateAds');
    };
  }, []);

  return (
    <div>
      {adData.map((ad, index) => (
        <div key={index}>
          {ad.type === 'text' && <p>{ad.content}</p>}
          {ad.type === 'image' && <img src={ad.content} alt="Ad" />}
          {ad.type === 'video' && <video src={ad.content} controls />}
        </div>
      ))}
    </div>
  );
};

export default AdViewer;
