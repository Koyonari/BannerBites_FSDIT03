import React from "react";
import AdComponent from "./AdComponent";

// Sidebar is a component that displays the ad options that can be added to the grid
const Sidebar = ({ showHelp }) => {
  const adOptions = [{ type: "Text" }, { type: "Image" }, { type: "Video" }];

  return (
    <div className="flex w-3/5 flex-row items-center justify-center border-none bg-transparent py-4 text-lg shadow-none dark:text-white lg:fixed lg:left-4 lg:top-[52vh] lg:h-auto lg:w-24 lg:-translate-y-1/2 lg:flex-col lg:items-start lg:pl-4 xl:pl-8 xl:text-xl 2xl:top-[49vh] 2xl:text-2xl 4xl:text-4xl">
      {adOptions.map((ad, index) => (
        <div
          data-tooltip-id="sidebar-tooltip"
          data-tooltip-content="Drag & drop element to add to grid"
          key={`container-${index}`}
          className="flex flex-1 justify-center rounded-lg border-none transition-colors hover:bg-orange-500 hover:text-white lg:mb-4 lg:flex-none last:lg:mb-0"
        >
          <AdComponent id={`sidebar-${ad.type}-${index}`} type={ad.type} />
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
