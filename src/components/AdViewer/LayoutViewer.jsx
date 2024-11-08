import React from "react";
import AdViewer from "../AdViewer/AdViewer"; // Adjust import path as necessary

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
