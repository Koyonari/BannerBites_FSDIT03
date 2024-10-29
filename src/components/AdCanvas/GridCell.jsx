import React, { useState } from "react";
import { useDrop } from "react-dnd";
import AdComponent from "./AdComponent";
import AdListPopup from "./AdListPopup";

const Checkbox = ({ checked, onChange, className }) => (
  <div
    className={`w-4 h-4 border-2 rounded cursor-pointer flex items-center justify-center bg-white hover:bg-gray-50 ${
      checked ? "border-blue-500" : "border-gray-300"
    } ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
  >
    {checked && (
      <svg
        className="w-3 h-3 text-blue-500"
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
  columns,
  totalCells,
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "AD_ITEM",
      drop: (draggedItem) => onDrop(draggedItem, index, rowIndex, colIndex),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop, index, rowIndex, colIndex]
  );

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = (e) => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
  };

  const handleCellClick = (e) => {
    e.stopPropagation();
    if (item && !item.hidden && !item.isMerged) {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      onSelect(index);
    }
  };

  const handleCheckboxChange = (checked) => {
    if (item && !item.hidden && !item.isMerged) {
      if (!isSelectionMode) {
        setIsSelectionMode(true); // Enter selection mode first
        onSelect(index); // Then select the cell
      } else {
        onSelect(index);
      }
    }
  };

  const handleMergeHorizontal = (e) => {
    e.stopPropagation();
    onMerge(index, "horizontal");
  };

  const handleMergeVertical = (e) => {
    e.stopPropagation();
    onMerge(index, "vertical");
  };

  const handleUnmerge = (e) => {
    e.stopPropagation();
    onUnmerge(index);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (adToDisplay) {
      onRemove(index, adToDisplay);
    } else {
      alert("No ad to remove");
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (adToDisplay) {
      onEdit(index, adToDisplay);
    } else {
      alert("No ad to edit");
    }
  };

  // Get current time in minutes since midnight
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

  return (
    <div
      ref={drop}
      onClick={handleCellClick}
      className={`grid-cell border border-gray-400 p-2 bg-white min-h-[150px] flex justify-center items-center box-border transition-transform duration-200 ease-in-out hover:outline hover:outline-2 hover:outline-offset-[-2px] hover:bg-orange-50 relative hover:outline-orange-300 ${
        isOver ? "bg-orange-50 outline-orange-300" : ""
      } ${mergedClass} ${selectionClass} ${selectedClass}`}
      style={{
        gridRow: item?.rowSpan ? `span ${item.rowSpan}` : "auto",
        gridColumn: item?.colSpan ? `span ${item.colSpan}` : "auto",
      }}
    >
      {/* Show checkbox for all non-hidden cells */}
      {item && !item.hidden && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="transition-colors duration-200 ease-in-out"
          />
        </div>
      )}

      {adToDisplay ? (
        <div className="cell-content">
          <AdComponent
            id={adToDisplay.ad.id}
            type={adToDisplay.ad.type}
            content={adToDisplay.ad.content}
            styles={adToDisplay.ad.styles}
          />
          <div className="actions mt-4 flex gap-5 flex-wrap">
            <button className="" onClick={handleEdit}>
              Edit
            </button>
            <button className="" onClick={togglePopup}>
              View List
            </button>
            {!item.isMerged && !isSelectionMode && (
              <>
                <button className="" onClick={handleMergeHorizontal}>
                  Merge Horizontally
                </button>
                <button className="" onClick={handleMergeVertical}>
                  Merge Vertically
                </button>
              </>
            )}
            <button onClick={handleRemove}>Remove</button>
            {item.isMerged && (
              <button
                className="button button-secondary"
                onClick={handleUnmerge}
              >
                Unmerge
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>Drop ad here</p>
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
