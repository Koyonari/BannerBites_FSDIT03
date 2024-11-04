import React, { useState } from "react";
import { useDrop } from "react-dnd";
import { Tooltip } from "react-tooltip";
import AdListPopup from "./AdListPopup";

const Checkbox = ({ checked, onChange, className, showHelp }) => (
  <div
    id="cellCheckbox"
    data-tooltip-id="checkbox-tooltip"
    data-tooltip-content="Click to multi-select cells"
    className={`flex h-4 w-4 cursor-pointer items-center justify-center border-2 bg-white hover:bg-gray-50 ${
      checked ? "border-orange-500" : "border-gray-300"
    } ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
  >
    {checked && (
      <svg
        className="h-3 w-3 text-orange-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    )}
  </div>
);

const GridCell = ({
  index,
  rowIndex,
  colIndex,
  onDrop,
  onRemove,
  onEdit,
  onMerge,
  onUnmerge,
  item,
  isSelected,
  onSelect,
  isSelectionMode,
  setIsSelectionMode,
  showHelp,
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "AD_ITEM",
      drop: (draggedItem) => onDrop(draggedItem, index, rowIndex, colIndex),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop, index, rowIndex, colIndex],
  );

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = (e) => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
  };

  const handleCheckboxChange = (checked) => {
    if (item && !item.hidden && !item.isMerged) {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      onSelect(index);
    }
  };

  const handleUnmerge = (e) => {
    e.stopPropagation();
    onUnmerge(index);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (adToDisplay) {
      onRemove(index, adToDisplay);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (adToDisplay) {
      const adToEdit = {
        ...adToDisplay,
        ad: {
          ...adToDisplay.ad,
          type: adToDisplay.ad.type
            ? adToDisplay.ad.type.charAt(0).toUpperCase() +
              adToDisplay.ad.type.slice(1)
            : adToDisplay.ad.type,
        },
      };
      onEdit(index, adToEdit);
    }
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let adToDisplay = null;
  if (item && item.scheduledAds && item.scheduledAds.length > 0) {
    const sortedAds = item.scheduledAds.sort((a, b) => {
      const [aHour, aMinute] = a.scheduledTime.split(":").map(Number);
      const [bHour, bMinute] = b.scheduledTime.split(":").map(Number);
      return aHour * 60 + aMinute - (bHour * 60 + bMinute);
    });

    for (let i = sortedAds.length - 1; i >= 0; i--) {
      const [adHour, adMinute] = sortedAds[i].scheduledTime
        .split(":")
        .map(Number);
      const adMinutes = adHour * 60 + adMinute;
      if (adMinutes <= currentMinutes) {
        adToDisplay = sortedAds[i];
        break;
      }
    }

    if (!adToDisplay) {
      adToDisplay = sortedAds[0];
    }
  }

  const renderAdContent = () => {
    if (!adToDisplay || !adToDisplay.ad)
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-center">Drop ad here</p>
        </div>
      );

    const { type, content, styles } = adToDisplay.ad;
    const contentStyle = {
      fontFamily: styles?.font || "Arial",
      fontSize: styles?.fontSize || "14px",
      color: styles?.textColor || "#000000",
      border: styles?.borderColor ? `1px solid ${styles.borderColor}` : "none",
      padding: "8px",
      borderRadius: "4px",
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    };

    // Show placeholder if content is missing
    const hasNoContent =
      type?.toLowerCase() === "text"
        ? !content?.title && !content?.description
        : !content?.src;

    if (hasNoContent) {
      return (
        <div
          className="flex h-full w-full items-center justify-center"
          style={contentStyle}
        >
          <p className="text-center text-gray-500">{type} Ad</p>
        </div>
      );
    }

    switch (type?.toLowerCase()) {
      case "text":
        return (
          <div style={contentStyle} className="overflow-hidden">
            <h3 className="font-bold">{content.title}</h3>
            <p>{content.description}</p>
          </div>
        );

      case "image":
        return (
          <div style={contentStyle}>
            <h3 className="mb-2 font-bold">{content.title}</h3>
            {content.src && (
              <div className="relative min-h-0 flex-1">
                <img
                  src={content.src}
                  alt={content.title}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            {content.description && (
              <p className="mt-2 text-sm">{content.description}</p>
            )}
          </div>
        );

      case "video":
        return (
          <div style={contentStyle} className="overflow-hidden">
            <h3 className="mb-2 font-bold">{content.title}</h3>
            {content.src && (
              <div className="relative min-h-0 flex-1">
                <video
                  controls
                  className="h-full w-full object-contain"
                  style={{ maxHeight: "150px" }}
                >
                  <source src={content.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {content.description && (
              <p className="mt-2 text-sm">{content.description}</p>
            )}
          </div>
        );

      default:
        return <p>Drop ad here</p>;
    }
  };

  const mergedClass = item?.isMerged
    ? item.mergeDirection === "horizontal"
      ? "merged-horizontal"
      : "merged-vertical"
    : "";

  const selectionClass =
    isSelectionMode && !item?.hidden && !item?.isMerged ? "selectable" : "";
  const selectedClass = isSelected ? "selected" : "";

  if (item?.hidden) {
    return null;
  }

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
  };

  // Tooltip Props
  const tooltipProps = {
    className: "custom-tooltip",
    style: tooltipStyle,
    isOpen: showHelp,
    place: "right",
  };

  return (
    <div
      ref={drop}
      className={`grid-cell relative z-[5] box-border flex flex-col gap-2 border border-gray-400 bg-white p-2 transition-transform duration-200 ease-in-out hover:bg-orange-50 hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:outline-orange-300 ${
        isOver ? "bg-orange-50 outline-orange-300" : ""
      } ${mergedClass} ${selectionClass} ${selectedClass} ${
        item?.isHidden ? "hidden" : ""
      } ${item?.isEmpty ? "invisible" : ""} ${
        item?.isSelectable ? "cursor-pointer transition-all" : ""
      }`}
      style={{
        gridRow: item?.rowSpan ? `span ${item.rowSpan}` : "auto",
        gridColumn: item?.colSpan ? `span ${item.colSpan}` : "auto",
      }}
    >
      {item && !item.hidden && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="transition-colors duration-200 ease-in-out"
            showHelp={showHelp}
          />
          <Tooltip id="checkbox-tooltip" {...tooltipProps} />
        </div>
      )}

      <div className="flex-1 overflow-hidden">{renderAdContent()}</div>

      {adToDisplay && (
        <div className="actions mt-auto flex flex-wrap gap-2">
          <button
            onClick={handleEdit}
            className="rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={togglePopup}
            className="rounded bg-gray-500 px-2 py-1 text-sm text-white hover:bg-gray-600"
          >
            View List
          </button>
          <button
            onClick={handleRemove}
            className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
          >
            Remove
          </button>
          {item.isMerged && (
            <button
              className="rounded bg-yellow-500 px-2 py-1 text-sm text-white hover:bg-yellow-600"
              onClick={handleUnmerge}
            >
              Unmerge
            </button>
          )}
        </div>
      )}

      {isPopupOpen && item.scheduledAds && item.scheduledAds.length > 0 && (
        <AdListPopup
          scheduledAds={item.scheduledAds}
          onClose={togglePopup}
          onEdit={(scheduledAd) => onEdit(index, scheduledAd)}
          onRemove={(scheduledAd) => onRemove(index, scheduledAd)}
        />
      )}
    </div>
  );
};

export default GridCell;
