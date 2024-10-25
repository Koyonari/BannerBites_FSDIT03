import React from "react";
import AdComponent from "./AdComponent";

const Sidebar = () => {
  const adOptions = [{ type: "Text" }, { type: "Image" }, { type: "Video" }];
  return (
    <div className="sidebar w-full flex justify-between items-center py-2 bg-transparent border-none">
      {adOptions.map((ad, index) => (
        <div key={`container-${index}`} className="flex-1 flex justify-center">
          <AdComponent id={`sidebar-${ad.type}-${index}`} type={ad.type} />
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
