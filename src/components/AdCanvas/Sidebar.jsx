import React from "react";
import AdComponent from "./AdComponent";

const Sidebar = () => {
  const adOptions = [{ type: "Text" }, { type: "Image" }, { type: "Video" }];

  return (
    <div className="lg:fixed lg:left-4 lg:top-[40vh] 2xl:top-[30vh] 3xl:top-[20vh] lg:-translate-y-1/2 lg:flex-col lg:h-auto lg:w-24 flex flex-row w-3/5 justify-center lg:items-start shadow-none items-center py-4 lg:pl-4 xl:pl-8 bg-transparent border-none">
      {adOptions.map((ad, index) => (
        <div
          key={`container-${index}`}
          className="lg:mb-4 last:lg:mb-0 flex-1 lg:flex-none flex justify-center border-none"
        >
          <AdComponent id={`sidebar-${ad.type}-${index}`} type={ad.type} />
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
