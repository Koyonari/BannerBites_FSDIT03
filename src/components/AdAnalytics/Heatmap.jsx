// src/components/AdAnalytics/Heatmap.jsx

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const Heatmap = ({ data, width, height, title }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("position", "absolute")
      .style("top", 0)
      .style("left", 0);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine the extent of the data
    const xExtent = d3.extent(data, (d) => d.x);
    const yExtent = d3.extent(data, (d) => d.y);

    // Create linear scales based on data extent
    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yExtent).range([0, innerHeight]);

    // Create a color scale
    const maxValue = d3.max(data, (d) => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, maxValue]);

    // Add circles to represent gaze points
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 10) // Adjust radius as needed
      .style("fill", (d) => colorScale(d.value))
      .style("opacity", 0.6)
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .style("pointer-events", "none"); // Allow interactions to pass through

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .text(title || "Heatmap");
  }, [data, width, height, title]);

  return <svg ref={svgRef}></svg>;
};

Heatmap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  title: PropTypes.string,
};

Heatmap.defaultProps = {
  width: 600,
  height: 400,
  title: "Heatmap",
};

export default Heatmap;
