import React from "react";
import AdViewer from "./AdViewer"; // adjust the path if needed

const LayoutViewer = ({ layout }) => {
  if (!layout) return <div>Loading layout...</div>;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
