import React, { useEffect, useState } from "react";
import AdViewer from "../AdViewer/AdViewer"; // Adjust import path as necessary

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    // Ensure the backend server URL and layoutId are correct here
    const eventSource = new EventSource(`http://localhost:5000/events?layoutId=${layoutId}`);

    eventSource.onopen = () => {
      console.log('[FRONTEND] Connected to SSE server');
    };

    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      console.log('[FRONTEND] Received SSE message:', parsedData);
      if ((parsedData.type === 'layoutUpdate' || parsedData.type === 'layoutData') && parsedData.data.layoutId === layoutId) {
        setLayout(parsedData.data);
        console.log('[FRONTEND] Layout updated via SSE:', parsedData.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[FRONTEND] SSE error:', error);
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, [layoutId]);

  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div>
      <h2>Layout Viewer</h2>
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
