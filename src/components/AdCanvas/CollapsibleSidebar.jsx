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
  Layout,
} from "lucide-react";
import Sidebar from "./Sidebar";
import AdsSidebar from "./AdsSidebar";
import { PRESET_TEMPLATES, loadPresetTemplate } from "../../template/template";

const CollapsibleSidebar = ({
  layouts,
  onSelectLayout,
  onDeleteLayoutClick,
  onStateChange,
  onTemplateSelect,
  selectedTemplateId,
  isVertical,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("layouts");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    onStateChange?.(isOpen);
  }, [isOpen, onStateChange]);

  // Filter out templates and only include user-created layouts
  const filteredLayouts = layouts.filter(
    (layout) =>
      layout.layoutId &&
      !Object.values(PRESET_TEMPLATES).some(
        (template) => template.layoutId === layout.layoutId,
      ) &&
      layout.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Template handling
  const handleTemplateSelect = (templateName) => {
    const template = loadPresetTemplate(templateName);
    if (template) {
      onTemplateSelect?.(template);
    }
  };

  const renderTemplateSection = () => (
    <div className="mb-4">
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="mb-2 flex w-full items-center justify-between rounded-lg bg-bg-accent px-4 py-2 text-sm text-text-light hover:scale-[1.02] hover:bg-bg-subaccent dark:text-text-dark"
      >
        <span className="flex items-center gap-2">
          <Layout className="h-4 w-4 hover:rotate-12" />
          Preset Templates
        </span>
        <div>
          {showTemplates ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      <div
        className={`flex flex-col gap-2 overflow-hidden ${
          showTemplates ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {Object.entries(PRESET_TEMPLATES).map(([key, template]) => (
          <div
            key={key}
            className="group relative transform hover:scale-[1.02]"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("template", key);
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            <button
              onClick={() => handleTemplateSelect(key)}
              className="w-full rounded-lg bg-bg-light px-4 py-2 text-left text-sm text-text-light hover:bg-bg-accent dark:bg-bg-dark dark:text-text-dark"
            >
              <div className="flex items-center gap-2">
                <span>{template.name}</span>
                <span className="text-xs text-placeholder-light dark:text-placeholder-dark">
                  {template.rows}x{template.columns}
                </span>
              </div>
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
              <span className="text-xs text-placeholder-light dark:text-placeholder-dark">
                Click
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        .hover-scale {
          transition: transform 0.3s ease;
        }

        .hover-scale:hover {
          transform: scale(1.02);
        }
      `}</style>
      <div
        className={`fixed ${
          isVertical
            ? "bottom-0 left-0 w-full"
            : "left-0 top-[5rem] w-[25vw] xl:top-[8rem]"
        } z-50 flex`}
      >
        <div
          className={`${
            isVertical
              ? `fixed bottom-0 left-0 w-full ${
                  isOpen ? "h-[40vh]" : "h-12"
                } rounded-t-3xl border-t-2`
              : `h-[calc(100vh-5rem)] xl:h-[calc(100vh-8rem)] ${
                  isOpen ? "w-[30vw]" : "w-12"
                } rounded-r-3xl border-r-2`
          } border-border-light bg-bg-light dark:border-border-dark dark:bg-bg-dark`}
        >
          <div className="relative flex h-full w-full flex-col shadow-lg">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${
                isVertical
                  ? "absolute -top-3 left-1/2 h-6 w-12 -translate-x-1/2 rounded-t-lg"
                  : "absolute -right-3 top-1/2 h-12 w-6 -translate-y-1/2 rounded-r-lg"
              } flex items-center justify-center bg-bg-accent text-text-light hover:scale-[1.05] hover:bg-bg-subaccent`}
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isVertical ? (
                isOpen ? (
                  <ChevronDown className="h-6 w-6 dark:text-text-dark" />
                ) : (
                  <ChevronUp className="h-6 w-6 dark:text-text-dark" />
                )
              ) : isOpen ? (
                <ChevronLeft className="h-6 w-6 dark:text-text-dark" />
              ) : (
                <ChevronRight className="h-6 w-6 dark:text-text-dark" />
              )}
            </button>

            <div
              className={`h-full overflow-y-auto ${
                isOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div className={`p-4 ${isVertical ? "" : "h-4/12"}`}>
                <h2 className="mb-4 text-center text-xl font-bold text-text-light dark:text-text-dark">
                  Elements
                </h2>
                <div className={isVertical ? "flex justify-center" : ""}>
                  <Sidebar />
                </div>
              </div>

              <div className="mb-3 flex h-12 w-full items-center justify-center gap-4 border-t-2 border-border-light pt-6 dark:border-border-dark">
                <button
                  onClick={() =>
                    setActiveSection(
                      activeSection === "layouts" ? null : "layouts",
                    )
                  }
                  className={`rounded-lg p-2 hover:scale-[1.05] ${
                    activeSection === "layouts"
                      ? "bg-bg-accent text-text-light"
                      : "text-placeholder-light hover:bg-bg-accent hover:text-text-light dark:text-placeholder-dark"
                  }`}
                >
                  <LayoutGrid className="h-6 w-6 dark:text-text-dark" />
                </button>
                <button
                  onClick={() =>
                    setActiveSection(activeSection === "ads" ? null : "ads")
                  }
                  className={`rounded-lg p-2 hover:scale-[1.05] ${
                    activeSection === "ads"
                      ? "bg-bg-accent text-text-light"
                      : "text-placeholder-light hover:bg-bg-accent hover:text-text-light dark:text-placeholder-dark"
                  }`}
                >
                  <ImagePlus className="h-6 w-6 dark:text-text-dark" />
                </button>
              </div>

              <div
                className={`p-4 ${isVertical ? "" : "h-[calc(66.333%-3rem)]"}`}
              >
                {activeSection === "layouts" && (
                  <div>
                    <h2 className="mb-4 text-lg font-bold text-text-light dark:text-text-dark">
                      Layouts
                    </h2>

                    {renderTemplateSection()}

                    <div className="relative mb-4 w-full">
                      <input
                        type="text"
                        placeholder="Search layouts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border-2 border-border-light bg-bg-light px-4 py-2 pl-10 text-sm text-placeholder-light focus:outline-none focus:ring-2 focus:ring-ring-primary dark:border-border-dark dark:bg-bg-dark dark:text-placeholder-dark"
                      />
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder-light dark:text-placeholder-dark" />
                    </div>

                    <div className="w-full border-l-2 border-border-light dark:border-border-dark">
                      <div className="flex w-full flex-col gap-2">
                        {filteredLayouts.map((layout) => (
                          <div
                            key={layout.layoutId}
                            className="flex transform items-center justify-between hover:scale-[1.02]"
                          >
                            <button
                              onClick={() => onSelectLayout(layout.layoutId)}
                              className="w-full rounded-lg bg-bg-light px-4 py-2 text-left text-sm text-text-light hover:bg-bg-accent dark:bg-bg-dark dark:text-text-dark"
                            >
                              {layout.name || "Unnamed Layout"}
                            </button>
                            <Trash
                              className="text-alert hover:text-alert-dark h-5 w-5 cursor-pointer hover:scale-110 dark:text-text-dark"
                              onClick={() =>
                                onDeleteLayoutClick(layout.layoutId)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "ads" && (
                  <div>
                    <h2 className="mb-4 text-lg font-bold text-text-light dark:text-text-dark">
                      Media
                    </h2>
                    <AdsSidebar />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CollapsibleSidebar;
