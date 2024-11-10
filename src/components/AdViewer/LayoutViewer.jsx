// src/components/LayoutViewer.jsx

import React from "react";
import AdViewer from "./AdViewer";
import PropTypes from "prop-types";

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

LayoutViewer.propTypes = {
  layout: PropTypes.shape({
    rows: PropTypes.number.isRequired,
    columns: PropTypes.number.isRequired,
    gridItems: PropTypes.array.isRequired,
  }),
};

export default LayoutViewer;
