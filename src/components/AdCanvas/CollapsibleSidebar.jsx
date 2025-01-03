import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Trash,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  ImagePlus,
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
  const [activeSection, setActiveSection] = useState("layouts");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    onStateChange?.(isOpen);
  }, [isOpen, onStateChange]);

  const filteredLayouts = layouts.filter((layout) =>
    layout.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const initialLayouts = filteredLayouts.slice(0, 3);
  const remainingLayouts = filteredLayouts.slice(3);
  const hasMore = filteredLayouts.length > 3;

  return (
    <div
      className={`fixed ${
        isVertical ? "bottom-0 left-0 w-full" : "left-0 top-0 w-[25vw]"
      } z-50 flex transition-all duration-300 ease-in-out`}
    >
      <div
        className={`${
          isVertical
            ? `fixed bottom-0 left-0 w-full ${
                isOpen ? "h-[40vh]" : "h-12"
              } rounded-t-3xl border-t`
            : `fixed left-0 top-0 h-screen ${
                isOpen ? "w-[30vw]" : "w-12"
              } rounded-r-3xl border-r`
        } border-border-light bg-bg-light transition-all duration-300 ease-in-out dark:border-border-dark dark:bg-bg-dark`}
      >
        <div className="relative flex h-full w-full flex-col shadow-lg">
          {/* Toggle Button */}
          <button
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content="Open to drag & drop element to add to grid"
            onClick={() => setIsOpen(!isOpen)}
            className={`${
              isVertical
                ? "absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 rounded-t-lg"
                : "absolute -right-3 top-1/2 h-12 w-6 -translate-y-1/2 rounded-r-lg"
            } flex items-center justify-center bg-bg-accent text-text-light hover:bg-bg-subaccent`}
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

          {/* Sidebar Content */}
          <div
            className={`h-full overflow-hidden transition-all duration-300 ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {/* Elements Section */}
            <div className="h-4/12 overflow-y-auto p-4">
              <h2 className="mb-4 text-center text-xl font-bold text-text-light dark:text-text-dark">
                Elements
              </h2>
              <Sidebar />
            </div>

            {/* Navigation Icons */}
            <div className="mb-3 flex h-12 w-full items-center justify-center gap-4 border-t border-border-light pt-6 dark:border-border-dark">
              <button
                onClick={() =>
                  setActiveSection(
                    activeSection === "layouts" ? null : "layouts",
                  )
                }
                className={`rounded-lg p-2 transition-colors ${
                  activeSection === "layouts"
                    ? "bg-bg-accent text-text-light"
                    : "text-placeholder-light hover:bg-bg-accent hover:text-text-light dark:text-placeholder-dark"
                }`}
              >
                <LayoutGrid className="h-6 w-6" />
              </button>
              <button
                onClick={() =>
                  setActiveSection(activeSection === "ads" ? null : "ads")
                }
                className={`rounded-lg p-2 transition-colors ${
                  activeSection === "ads"
                    ? "bg-bg-accent text-text-light"
                    : "text-placeholder-light hover:bg-bg-accent hover:text-text-light dark:text-placeholder-dark"
                }`}
              >
                <ImagePlus className="h-6 w-6" />
              </button>
            </div>

            {/* Content Section */}
            <div className="h-[calc(66.333%-3rem)] overflow-y-auto p-4">
              {activeSection === "layouts" && (
                <>
                  <h2 className="mb-4 text-lg font-bold text-text-light dark:text-text-dark">
                    Layouts
                  </h2>
                  <div className="relative mb-4 w-full">
                    <input
                      type="text"
                      placeholder="Search layouts"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-border-light bg-bg-light px-4 py-2 pl-10 text-sm text-placeholder-light focus:outline-none focus:ring-2 focus:ring-ring-primary dark:border-border-dark dark:bg-bg-dark dark:text-placeholder-dark"
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder-light dark:text-placeholder-dark" />
                  </div>

                  <div className="w-full border-l border-border-light dark:border-border-dark">
                    <div className="flex w-full flex-col gap-2">
                      {initialLayouts.map((layout) => (
                        <div
                          key={layout.layoutId}
                          className="flex items-center justify-between"
                        >
                          <button
                            onClick={() => onSelectLayout(layout.layoutId)}
                            className="w-full rounded-lg bg-bg-accent px-4 py-2 text-left text-sm text-text-light hover:bg-bg-subaccent dark:text-text-dark"
                          >
                            {layout.name || "Unnamed Layout"}
                          </button>
                          <Trash
                            className="text-alert hover:text-alert-dark h-5 w-5 cursor-pointer"
                            onClick={() => onDeleteLayoutClick(layout.layoutId)}
                          />
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <>
                        <div
                          className={`flex flex-col gap-2 overflow-hidden transition-all duration-200 ${
                            showMore ? "max-h-48" : "max-h-0"
                          }`}
                        >
                          {remainingLayouts.map((layout) => (
                            <div
                              key={layout.layoutId}
                              className="flex items-center justify-between"
                            >
                              <button
                                onClick={() => onSelectLayout(layout.layoutId)}
                                className="w-full rounded-lg bg-bg-accent px-4 py-2 text-left text-sm text-text-light hover:bg-bg-subaccent dark:text-text-dark"
                              >
                                {layout.name || "Unnamed Layout"}
                              </button>
                              <Trash
                                className="text-alert hover:text-alert-dark h-5 w-5 cursor-pointer"
                                onClick={() =>
                                  onDeleteLayoutClick(layout.layoutId)
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setShowMore(!showMore)}
                          className="mt-2 flex w-full items-center justify-between rounded-lg bg-bg-accent px-4 py-2 text-left text-sm text-text-light hover:bg-bg-subaccent dark:text-text-dark"
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
                </>
              )}

              {activeSection === "ads" && (
                <>
                  <h2 className="mb-4 text-lg font-bold text-text-light dark:text-text-dark">
                    Ads
                  </h2>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search advertisements"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-primary dark:secondary-border dark:neutralalt-bg dark:secondary-text"
                      />
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 neutral-text" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="h-24 w-full rounded-lg bg-bg-light dark:bg-bg-dark"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
