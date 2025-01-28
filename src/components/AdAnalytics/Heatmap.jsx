// src/components/AdAnalytics/Heatmap.jsx

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

const Heatmap = ({ data, width, height, title }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) {
      // If there's no data, clear the SVG and return
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    // Define margins
    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create group element for margins
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define scales
    const xValues = Array.from(new Set(data.map((d) => d.x)));
    const yValues = Array.from(new Set(data.map((d) => d.y)));

    const xScale = d3
      .scaleBand()
      .domain(xValues)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(yValues)
      .range([0, innerHeight])
      .padding(0.05);

    const maxValue = d3.max(data, (d) => d.value) || 1;

    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, maxValue]);

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Add Y axis
    g.append("g").call(d3.axisLeft(yScale));

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .text(title || "Heatmap");

    // Create tooltip
    const tooltip = d3
      .select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0,0,0,0.7)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Define zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 10]) // Define the scale extent
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ]) // Define the translate extent
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    // Apply zoom to the SVG
    svg.call(zoom);

    // Add heatmap rectangles
    g.selectAll("rect")
      .data(data, (d) => `${d.x}:${d.y}`)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "#fff")
      .style("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>X:</strong> ${d.x}<br/><strong>Y:</strong> ${d.y}<br/><strong>Value:</strong> ${d.value}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Add color legend
    const legendWidth = 20;
    const legendHeight = innerHeight;

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right + 20}, ${margin.top})`
      );

    // Define gradient
    const defs = svg.append("defs");

    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    // Define gradient stops
    linearGradient
      .selectAll("stop")
      .data(
        colorScale.ticks().map((t, i, n) => ({
          offset: `${(i / (n.length - 1)) * 100}%`,
          color: colorScale(t),
        }))
      )
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    // Draw the rectangle and fill with gradient
    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#linear-gradient)");

    // Define scale for legend
    const legendScale = d3
      .scaleLinear()
      .domain(colorScale.domain())
      .range([legendHeight, 0]);

    // Add legend axis
    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickSize(-legendWidth);

    legend
      .append("g")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .select(".domain")
      .remove();
  }, [data, width, height, title]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      <div ref={tooltipRef}></div>
    </div>
  );
};

Heatmap.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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
