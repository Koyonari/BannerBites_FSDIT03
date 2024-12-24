import React, { useState } from "react";
import { ChevronDown, ChevronUp, Search, Trash } from "lucide-react";

const LayoutSelector = ({ layouts, onSelect, onDeleteLayoutClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter layouts based on search query
  const filteredLayouts = layouts.filter((layout) =>
    layout.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Separate the first 3 layouts and the remaining layouts
  const initialLayouts = filteredLayouts.slice(0, 3);
  const remainingLayouts = filteredLayouts.slice(3);
  const hasMore = filteredLayouts.length > 3;

  const buttonBaseClasses =
    "w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:primary-bg hover:secondary-text dark:secondary-text dark:hover:bg-gray-700";

  return (
    <div className="flex w-4/5 flex-col items-center justify-center gap-2 overflow-y-auto bg-transparent py-4 text-lg shadow-none dark:secondary-text lg:fixed lg:right-4 lg:top-[52vh] lg:h-auto lg:w-[10vw] lg:-translate-y-1/2 lg:flex-col lg:items-stretch lg:pr-4 xl:pr-6 xl:text-xl 2xl:top-[49vh] 2xl:text-2xl 4xl:text-4xl">
      {/* Search bar */}
      <div className="relative mb-2 w-full">
        <input
          type="text"
          placeholder="Search layouts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus:ring-secondary w-full rounded-lg border px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 dark:secondary-border dark:g2color-bg dark:secondary-text"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 gcolor-text" />
      </div>

      {/* Layout list */}
      <div className="w-full border-l primary-border dark:white-border">
        <div className="flex w-full flex-col gap-2">
          {/* Display initial 3 layouts */}
          {initialLayouts.map((layout) => (
            <div
              key={layout.layoutId}
              className="flex items-center justify-between"
            >
              <button
                onClick={() => onSelect(layout.layoutId)}
                className={buttonBaseClasses}
              >
                {layout.name || "Unnamed Layout"}
              </button>
              <Trash
                className="h-5 w-5 cursor-pointer alert-text hover:alert2-text"
                onClick={() => onDeleteLayoutClick(layout.layoutId)}
              />
            </div>
          ))}
        </div>

        {/* Expandable section for remaining layouts */}
        {hasMore && (
          <>
            <div
              className={`flex flex-col gap-2 overflow-y-auto transition-all duration-200 ease-in-out ${
                isOpen ? "max-h-48 overflow-y-auto" : "max-h-0"
              }`}
            >
              {remainingLayouts.map((layout) => (
                <div
                  key={layout.layoutId}
                  className="flex items-center justify-between"
                >
                  <button
                    onClick={() => onSelect(layout.layoutId)}
                    className={buttonBaseClasses}
                  >
                    {layout.name || "Unnamed Layout"}
                  </button>
                  <Trash
                    className="h-5 w-5 cursor-pointer alert-text hover:alert2-text"
                    onClick={() => onDeleteLayoutClick(layout.layoutId)}
                  />
                </div>
              ))}
            </div>

            {/* Show More/Show Less button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${buttonBaseClasses} mt-2 flex items-center justify-between`}
            >
              <span>{isOpen ? "Show Less" : `Show More`}</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LayoutSelector;
