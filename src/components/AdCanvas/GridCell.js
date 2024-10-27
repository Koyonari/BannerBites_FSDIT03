// GridCell.js
import React, { useState } from "react";
import { useDrop } from "react-dnd";
import AdComponent from "./AdComponent";
import AdListPopup from "./AdListPopup"; // Ensure this component is imported

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
    if (isSelectionMode && item && !item.isMerged) {
      onSelect(index);
    }
    // Removed the else if block that automatically opens the popup
  };

  // Merge handlers
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

  // Handle removing and editing cells
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
  // Sort scheduledAds by time
  const sortedAds = item.scheduledAds.sort((a, b) => {
    const [aHour, aMinute] = a.scheduledTime.split(":").map(Number);
    const [bHour, bMinute] = b.scheduledTime.split(":").map(Number);
    return aHour * 60 + aMinute - (bHour * 60 + bMinute);
  });

  // Find the latest ad scheduled before or at the current time
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

  // If no ad is found, display the earliest ad scheduled for the day
  if (!adToDisplay) {
    adToDisplay = sortedAds[0];
  }
}

  // CSS classes for merged, selected, and selectable cells
  const mergedClass = item?.isMerged
    ? item.mergeDirection === "horizontal"
      ? "merged-horizontal"
      : "merged-vertical"
    : "";

  const selectionClass = isSelectionMode && item ? "selectable" : "";
  const selectedClass = isSelected ? "selected" : "";

  // If the cell is hidden (due to merging), do not render it
  if (item?.hidden) {
    return null;
  }

  return (
    <div
      ref={drop}
      onClick={handleCellClick}
      className={`grid-cell ${
        isOver ? "hover" : ""
      } ${mergedClass} ${selectionClass} ${selectedClass}`}
      style={{
        gridRow: item?.rowSpan ? `span ${item.rowSpan}` : "auto",
        gridColumn: item?.colSpan ? `span ${item.colSpan}` : "auto",
      }}
    >
      {adToDisplay ? (
        <div className="cell-content">
          <AdComponent
            id={adToDisplay.ad.id}
            type={adToDisplay.ad.type}
            content={adToDisplay.ad.content}
            styles={adToDisplay.ad.styles}
          />
          <div className="actions">
            <button className="button" onClick={handleEdit}>
              Edit
            </button>
            <button className="button button-secondary" onClick={togglePopup}>
              View List
            </button>
            {!item.isMerged && !isSelectionMode && (
              <>
                <button className="button" onClick={handleMergeHorizontal}>
                  Merge Horizontally
                </button>
                <button className="button" onClick={handleMergeVertical}>
                  Merge Vertically
                </button>
              </>
            )}
            <button className="button button-danger" onClick={handleRemove}>
              Remove
            </button>
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
      {/* Pop-up for viewing all scheduled ads */}
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
