import React from "react";
import AdComponent from "./AdComponent";

const Sidebar = ({ showHelp }) => {
  const adOptions = [{ type: "Text" }, { type: "Image" }, { type: "Video" }];

  return (
    <div className="text-md flex w-3/5 flex-row py-4 shadow-none dark:secondary-text md:flex-col lg:left-4 lg:top-[52vh] lg:h-auto lg:w-24 lg:items-start lg:pl-4 xl:pl-8 xl:text-xl 2xl:top-[49vh] 2xl:text-2xl 4xl:text-4xl">
      {adOptions.map((ad, index) => (
        <div
          key={`container-${index}`}
          className="flex flex-1 justify-center rounded-lg border-none transition-colors hover:primary-bg hover:secondary-text lg:mb-4 lg:flex-none last:lg:mb-0"
        >
          <AdComponent id={`sidebar-${ad.type}-${index}`} type={ad.type} />
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
