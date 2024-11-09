// src/components/LayoutViewer.jsx

import React from "react";
import AdViewer from "../AdViewer/AdViewer"; 

const LayoutViewer = ({ layout }) => {
  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div id="advertisement" className="relative w-full h-full flex items-center justify-center">
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
