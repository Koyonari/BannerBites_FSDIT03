// src/components/AdAnalytics/HeatmapOverlay.jsx

import React from "react";
import Heatmap from "./Heatmap";
import PropTypes from "prop-types";

const HeatmapOverlay = ({ heatmapData, layoutDimensions }) => {
  if (
    !heatmapData ||
    heatmapData.length === 0 ||
    layoutDimensions.width === 0 ||
    layoutDimensions.height === 0
  ) {
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-transparent">
        <p className="text-gray-500">No heatmap data available.</p>
      </div>
    );
  }

  return (
    <Heatmap
      data={heatmapData}
      width={layoutDimensions.width}
      height={layoutDimensions.height}
      title=" "
    />
  );
};

HeatmapOverlay.propTypes = {
  heatmapData: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  layoutDimensions: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }).isRequired,
};

export default HeatmapOverlay;
