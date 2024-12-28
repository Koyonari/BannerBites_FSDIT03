import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Trash,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Sidebar from "./Sidebar";

const CollapsibleSidebar = ({
  layouts,
  onSelectLayout,
  onDeleteLayoutClick,
  onStateChange,
  isVertical,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    onStateChange?.(isOpen);
  }, [isOpen, onStateChange]);

  const filteredLayouts = layouts.filter((layout) =>
    layout.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const initialLayouts = filteredLayouts.slice(0, 3);
  const remainingLayouts = filteredLayouts.slice(3);
  const hasMore = filteredLayouts.length > 3;
  const [showMore, setShowMore] = useState(false);

  const buttonBaseClasses =
    "w-full rounded-lg px-4 py-2 text-left text-sm transition-colors hover:pcolor-bg hover:secondary-text dark:secondary-text dark:hover:dark-bg";

  return (
    <div
      className={`fixed ${
        isVertical ? "bottom-0 left-0 w-full" : "left-0 top-0 w-[25vw]"
      } z-50 flex transition-all duration-300 ease-in-out`}
    >
      <div
        className={`${
          isVertical
            ? `fixed bottom-0 left-0 w-full pt-0 transition-all duration-300 ease-in-out ${
                isOpen ? "h-[40vh]" : "h-12"
              }`
            : `fixed left-0 top-0 h-screen pt-[10vh] transition-all duration-300 ease-in-out ${
                isOpen ? "w-[17.5vw]" : "w-12"
              }`
        }`}
      >
        <div className="relative flex h-full w-full flex-col shadow-lg light-bg dark:dark-bg">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${
              isVertical
                ? "absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 rounded-t-lg"
                : "absolute -right-3 top-1/2 h-12 w-6 -translate-y-1/2 rounded-r-lg"
            } flex items-center justify-center pcolor-bg light-text hover:p2color-bg`}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isVertical ? (
              isOpen ? (
                <ChevronDown className="h-6 w-6" />
              ) : (
                <ChevronUp className="h-6 w-6" />
              )
            ) : isOpen ? (
              <ChevronLeft className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </button>

          <div
            className={`mt-20 h-full overflow-hidden transition-all duration-300 ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Elements Section */}
            <div className="h-1/5 overflow-y-auto p-4">
              <h2 className="mb-4 text-center text-xl font-bold secondary-text">
                Elements
              </h2>
              <div className="pr-2">
                <Sidebar />
              </div>
            </div>

            {/* Ads Section */}
            <div className="h-2/5 border-b p-4 primary-border dark:secondary-border">
              <h2 className="mb-4 text-lg font-bold primary-text dark:secondary-text">
                Ads
              </h2>
              <div className="flex flex-col gap-4">
                <div className="h-24 w-full rounded-lg gcolor-bg dark:g2color-bg"></div>
              </div>
            </div>

            {/* Layouts Section */}
            <div className="h-2/5 overflow-y-auto border-t p-4 primary-border dark:secondary-border">
              <h2 className="mb-4 text-lg font-bold primary-text dark:secondary-text">
                Layouts
              </h2>

              <div className="relative mb-4 w-full">
                <input
                  type="text"
                  placeholder="Search layouts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-primary dark:secondary-border dark:g2color-bg dark:secondary-text"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 gcolor-text" />
              </div>

              <div className="w-full border-l primary-border dark:white-border">
                <div className="flex w-full flex-col gap-2">
                  {initialLayouts.map((layout) => (
                    <div
                      key={layout.layoutId}
                      className="flex items-center justify-between"
                    >
                      <button
                        onClick={() => onSelectLayout(layout.layoutId)}
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

                {hasMore && (
                  <>
                    <div
                      className={`flex flex-col gap-2 overflow-y-auto transition-all duration-200 ease-in-out ${
                        showMore ? "max-h-48 overflow-y-auto" : "max-h-0"
                      }`}
                    >
                      {remainingLayouts.map((layout) => (
                        <div
                          key={layout.layoutId}
                          className="flex items-center justify-between"
                        >
                          <button
                            onClick={() => onSelectLayout(layout.layoutId)}
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

                    <button
                      onClick={() => setShowMore(!showMore)}
                      className={`${buttonBaseClasses} mt-2 flex items-center justify-between`}
                    >
                      <span>{showMore ? "Show Less" : "Show More"}</span>
                      {showMore ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
