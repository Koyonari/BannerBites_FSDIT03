import React from "react";
import AdViewer from "../AdViewer/AdViewer"; // Adjust import path as necessary

// LayoutViewer is a component that renders the layout of ads, wraps AdViewer component
const LayoutViewer = ({ layout }) => {
  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div>
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
