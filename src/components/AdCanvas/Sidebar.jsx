import React from "react";
import AdComponent from "./AdComponent";
import { Tooltip } from "react-tooltip";

const Sidebar = ({ showHelp }) => {
  const adOptions = [{ type: "Text" }, { type: "Image" }, { type: "Video" }];

  // Tooltip style
  const tooltipStyle = {
    backgroundColor: "rgb(255, 255, 255)",
    color: "black",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 1), 0 2px 4px -1px rgba(0, 0, 0, 1)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    zIndex: 1000,
  };

  // Tooltip Props
  const tooltipProps = {
    style: tooltipStyle,
    isOpen: showHelp,
    place: "right",
  };

  return (
    <div className="lg:fixed text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-5xl lg:left-4 lg:top-[52vh] 2xl:top-[49vh] 3xl:top-[30vh] lg:-translate-y-1/2 lg:flex-col lg:h-auto lg:w-24 flex flex-row w-3/5 justify-center lg:items-start shadow-none items-center py-4 lg:pl-4 xl:pl-8 bg-transparent border-none">
      {adOptions.map((ad, index) => (
        <div
          data-tooltip-id="sidebar-tooltip"
          data-tooltip-content="Drag & drop element to add to grid"
          key={`container-${index}`}
          className="lg:mb-4 last:lg:mb-0 flex-1 lg:flex-none flex justify-center border-none"
        >
          <AdComponent id={`sidebar-${ad.type}-${index}`} type={ad.type} />
        </div>
      ))}
      <div>
        <Tooltip id="sidebar-tooltip" {...tooltipProps} />
      </div>
    </div>
  );
};

export default Sidebar;
