// src/components/AdAnalytics/Heatmap.jsx

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const Heatmap = ({ data, width, height, title }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    // If no data, clear out any previous drawing
    if (!data || data.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // 1) Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // 2) Set up container dimensions
    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 3) Create the base SVG, position it absolutely over the layout
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("position", "absolute")
      .style("top", 0)
      .style("left", 0);

    // 4) Append a <g> element for margins
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 5) Compute the extents and create scales
    const xExtent = d3.extent(data, (d) => d.x);
    const yExtent = d3.extent(data, (d) => d.y);
    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yExtent).range([0, innerHeight]);

    // 6) Color & opacity scales based on `d.value`
    const maxValue = d3.max(data, (d) => d.value) || 1;

    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateTurbo) // warm yellow → brown
      .domain([0, maxValue]);

    const opacityScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([0.2, 1]); // circles with lower value are more transparent

    // 7) Draw circles for each point
    g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", 10)
    .style("fill", (d) => colorScale(d.value))
    .style("opacity", (d) => opacityScale(d.value) * 0.6) // or just .style("opacity", 0.4)
    .style("stroke", "none"); // remove the outline completely

    // 8) Add a title at the top
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
