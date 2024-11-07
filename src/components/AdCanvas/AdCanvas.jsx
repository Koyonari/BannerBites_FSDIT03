import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import Sidebar from "./Sidebar";
import GridCell from "./GridCell";
import EditModal from "./EditModal";
import ScheduleModal from "./ScheduleModal";
import SaveLayoutModal from "./SaveLayoutModal";
import SelectionModePopup from "./SelectionModePopup";
import { MoveLeft, Merge, Check, CircleHelp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "react-tooltip";

const AdCanvas = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const totalCells = rows * columns;
  const [gridItems, setGridItems] = useState(
    Array.from({ length: totalCells }, () => ({
      scheduledAds: [],
      isMerged: false,
      hidden: false,
      rowSpan: 1,
      colSpan: 1,
    })),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [selectedMergedCells, setSelectedMergedCells] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [currentScheduleAd, setCurrentScheduleAd] = useState(null);
  const [isNamingLayout, setIsNamingLayout] = useState(false);
  const navigate = useNavigate();

  const handleMoveLeft = () => {
    navigate(-1);
  };

  const handleOpenSelector = async () => {
    setIsNamingLayout(true);
  };

  const resizeGrid = (newRows, newColumns) => {
    const newTotalCells = newRows * newColumns;
    const updatedGrid = Array.from({ length: newTotalCells }, () => ({
      scheduledAds: [],
      isMerged: false,
      hidden: false,
      rowSpan: 1,
      colSpan: 1,
    }));

    for (let i = 0; i < Math.min(gridItems.length, newTotalCells); i++) {
      updatedGrid[i] = gridItems[i];
    }

    setGridItems(updatedGrid);
  };

  const increaseRows = () => {
    const newRows = rows + 1;
    setRows(newRows);
    resizeGrid(newRows, columns);
  };

  const decreaseRows = () => {
    if (rows > 1) {
      const newRows = rows - 1;
      setRows(newRows);
      resizeGrid(newRows, columns);
    }
  };

  const increaseColumns = () => {
    const newColumns = columns + 1;
    setColumns(newColumns);
    resizeGrid(rows, newColumns);
  };

  const decreaseColumns = () => {
    if (columns > 1) {
      const newColumns = columns - 1;
      resizeGrid(rows, newColumns);
      setColumns(newColumns);
    }
  };

  const validateMerge = (selectedCells) => {
    if (selectedCells.length <= 1) {
      return false;
    }

    const rows = selectedCells.map((index) => Math.floor(index / columns));
    const cols = selectedCells.map((index) => index % columns);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Check for merged cells in selection
    const containsMergedCells = selectedCells.some(
      (index) => gridItems[index].isMerged && !gridItems[index].hidden,
    );

    // If trying to merge with an existing merged cell
    if (containsMergedCells) {
      // Get all merged cells involved
      const mergedCellsInSelection = selectedCells.filter(
        (index) => gridItems[index].isMerged && !gridItems[index].hidden,
      );

      // For each merged cell, get its dimensions
      for (const mergedIndex of mergedCellsInSelection) {
        const mergedCell = gridItems[mergedIndex];
        const mergedMinRow = Math.floor(mergedIndex / columns);
        const mergedMaxRow = mergedMinRow + (mergedCell.rowSpan - 1);
        const mergedMinCol = mergedIndex % columns;
        const mergedMaxCol = mergedMinCol + (mergedCell.colSpan - 1);

        // Check if the merged cell aligns with the selection
        if (
          (mergedMinRow === minRow && mergedMaxRow === maxRow) || // Vertical alignment
          (mergedMinCol === minCol && mergedMaxCol === maxCol) // Horizontal alignment
        ) {
          continue;
        } else {
          return false;
        }
      }
    }

    // Check if selection forms a valid rectangle
    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;

    // For selections that include merged cells, we need to account for their spans
    const expectedCellCount = width * height;
    const actualCellCount = selectedCells.length;

    // The actual cell count might be less than expected due to hidden cells
    if (actualCellCount > expectedCellCount) {
      return false;
    }

    // Validate that all visible cells in the rectangle are selected
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * columns + col;
        const cell = gridItems[index];

        if (cell.hidden) {
          continue; // Skip hidden cells (part of existing merged cells)
        }

        if (!selectedCells.includes(index)) {
          return false; // Missing a visible cell in the rectangle
        }
      }
    }

    return true;
  };

  const handleMerge = (index, direction, selectedCells = []) => {
    const updatedGrid = [...gridItems];

    if (!updatedGrid[index]) {
      alert("Invalid cell selection!");
      return;
    }

    let indicesToMerge = [];

    if (selectedCells.length > 0) {
      if (!validateMerge(selectedCells)) {
        alert("Invalid merge selection. Please check your selection.");
        return;
      }
      indicesToMerge = selectedCells;
    } else if (direction === "horizontal" || direction === "vertical") {
      if (direction === "horizontal") {
        if ((index + 1) % columns === 0) {
          alert("Cannot merge horizontally. No adjacent cell to the right.");
          return;
        }
        const rightIndex = index + 1;
        if (
          updatedGrid[rightIndex] &&
          !updatedGrid[rightIndex].isMerged &&
          !updatedGrid[rightIndex].hidden
        ) {
          indicesToMerge = [index, rightIndex];
        } else {
          alert("Cannot merge horizontally. Adjacent cell is invalid.");
          return;
        }
      } else if (direction === "vertical") {
        const bottomIndex = index + columns;
        if (bottomIndex >= totalCells) {
          alert("Cannot merge vertically. No adjacent cell below.");
          return;
        }
        if (
          updatedGrid[bottomIndex] &&
          !updatedGrid[bottomIndex].isMerged &&
          !updatedGrid[bottomIndex].hidden
        ) {
          indicesToMerge = [index, bottomIndex];
        } else {
          alert("Cannot merge vertically. Adjacent cell is invalid.");
          return;
        }
      }
    }

    if (indicesToMerge.length > 0) {
      // Calculate the dimensions of the merged cell
      const rows = indicesToMerge.map((idx) => Math.floor(idx / columns));
      const cols = indicesToMerge.map((idx) => idx % columns);
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      const mergedScheduledAds = indicesToMerge.reduce((ads, idx) => {
        return ads.concat(updatedGrid[idx].scheduledAds || []);
      }, []);

      const mergedItem = {
        scheduledAds: mergedScheduledAds,
        isMerged: true,
        hidden: false,
        rowSpan: maxRow - minRow + 1,
        colSpan: maxCol - minCol + 1,
        mergeDirection: direction || "selection",
        selectedCells: indicesToMerge,
      };

      // Update the first cell with merged properties
      updatedGrid[indicesToMerge[0]] = mergedItem;

      // Hide other cells involved in the merge
      indicesToMerge.slice(1).forEach((cellIndex) => {
        updatedGrid[cellIndex] = {
          scheduledAds: [],
          isMerged: true,
          hidden: true,
          rowSpan: 1,
          colSpan: 1,
        };
      });

      setGridItems(updatedGrid);
    } else {
      alert("Cannot merge the selected cells.");
    }
  };

  const handleCellSelection = (index) => {
    const cell = gridItems[index];

    // If the cell is merged
    if (cell.isMerged && !cell.hidden) {
      setSelectedMergedCells((prev) => {
        if (prev.includes(index)) {
          const newSelection = prev.filter((i) => i !== index);
          if (newSelection.length === 0) {
            setIsSelectionMode(false);
          }
          return newSelection;
        }
        return [...prev, index];
      });
      setIsSelectionMode(true);
      return;
    }

    // For non-merged cells
    if (!cell.hidden) {
      setSelectedCells((prev) => {
        if (prev.includes(index)) {
          const newSelection = prev.filter((i) => i !== index);
          if (newSelection.length === 0) {
            setIsSelectionMode(false);
          }
          return newSelection;
        }
        return [...prev, index];
      });
      if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
    }
  };

  const handleMergeSelected = () => {
    // Case 1: Single merged cell selected - unmerge it
    if (selectedMergedCells.length === 1 && selectedCells.length === 0) {
      handleUnmerge(selectedMergedCells[0]);
      setSelectedMergedCells([]);
      setIsSelectionMode(false);
      return;
    }

    // Case 2: Multiple cells selected including merged cells
    if (selectedMergedCells.length > 0) {
      const unmergedCells = selectedMergedCells.reduce((acc, index) => {
        const cell = gridItems[index];
        if (cell.selectedCells) {
          return [...acc, ...cell.selectedCells];
        }
        return [...acc, index];
      }, []);

      const allCellsToMerge = [
        ...new Set([...unmergedCells, ...selectedCells]),
      ];

      if (validateMerge(allCellsToMerge)) {
        selectedMergedCells.forEach((index) => {
          handleUnmerge(index);
        });

        const sortedCells = [...allCellsToMerge].sort((a, b) => a - b);
        handleMerge(sortedCells[0], "selection", sortedCells);
      } else {
        alert("Selected cells must form a valid rectangle or square.");
      }

      setSelectedMergedCells([]);
      setSelectedCells([]);
      setIsSelectionMode(false);
      return;
    }

    // Case 3: Regular merge operation for non-merged cells
    if (selectedCells.length < 2) {
      alert("Please select at least 2 cells to merge.");
      return;
    }

    if (!validateMerge(selectedCells)) {
      alert("Selected cells must form a valid rectangle or square.");
      setSelectedCells([]);
      setIsSelectionMode(false);
      return;
    }

    const sortedCells = [...selectedCells].sort((a, b) => a - b);
    handleMerge(sortedCells[0], "selection", sortedCells);
    setSelectedCells([]);
    setIsSelectionMode(false);
  };

  const handleUnmerge = (index) => {
    const updatedGrid = [...gridItems];
    const cell = updatedGrid[index];

    if (cell.isMerged) {
      const cellsToUnmerge =
        cell.selectedCells && cell.selectedCells.length > 0
          ? cell.selectedCells
          : [index];

      const scheduledAds = cell.scheduledAds;

      cellsToUnmerge.forEach((idx, idxIndex) => {
        updatedGrid[idx] = {
          scheduledAds: idxIndex === 0 ? scheduledAds : [],
          isMerged: false,
          hidden: false,
          rowSpan: 1,
          colSpan: 1,
        };
      });
    }

    setGridItems(updatedGrid);
  };

  const handleDrop = (item, index, rowIndex, colIndex) => {
    const normalizedItem = {
      id: item.id || uuidv4(),
      type: item.type || "default",
      content: item.content || item,
      styles: item.styles || {},
    };

    setCurrentScheduleAd({ item: normalizedItem, index });
    setIsScheduling(true);
  };

  const handleScheduleSave = (adItem, scheduledTime, index) => {
    // Validate that adItem has a content property
    if (!adItem.content) {
      console.error("AdItem is missing the 'content' property:", adItem);
      alert("Failed to schedule the ad. Missing content information.");
      return;
    }
    const updatedGrid = [...gridItems];
    const scheduledAd = {
      id: uuidv4(),
      ad: { ...adItem, id: uuidv4() },
      scheduledTime,
    };
    updatedGrid[index].scheduledAds.push(scheduledAd);
    setGridItems(updatedGrid);
    setIsScheduling(false);
    setCurrentScheduleAd(null);
  };

  // Handles removing ads from a grid cell
  const handleRemove = (index, scheduledAd) => {
    const updatedGrid = [...gridItems];
    const cell = updatedGrid[index];
    // Remove the scheduled ad
    if (cell.scheduledAds && cell.scheduledAds.length > 0) {
      updatedGrid[index].scheduledAds = cell.scheduledAds.filter(
        (ad) => ad.id !== scheduledAd.id,
      );
    }
    if (updatedGrid[index].scheduledAds.length === 0 && cell.isMerged) {
      const cellsToUnmerge =
        cell.selectedCells && cell.selectedCells.length > 0
          ? cell.selectedCells
          : [index];
      cellsToUnmerge.forEach((idx) => {
        updatedGrid[idx] = {
          scheduledAds: [],
          isMerged: false,
          hidden: false,
          rowSpan: 1,
          colSpan: 1,
        };
      });
    }
    setGridItems(updatedGrid);
  };

  // New function to handle the actual save after name is entered
  const handleLayoutNameSave = async (name) => {
    try {
      const layoutId = uuidv4();
      const layout = { rows, columns, gridItems, layoutId, name };
      const cleanedLayout = cleanLayoutJSON(layout);

      const response = await axios.post(
        "http://localhost:5000/api/saveLayout",
        cleanedLayout,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Layout saved successfully:", response.data);
      alert("Layout saved successfully!");
      setIsNamingLayout(false);
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout. Please try again.");
    }
  };

  const cleanLayoutJSON = (layout) => {
    const { rows, columns, gridItems } = layout;

    const filteredItems = gridItems
      .map((item, index) => {
        if (!item || item.hidden) return null;

        const row = Math.floor(index / columns);
        const column = index % columns;

        return {
          index,
          row,
          column,
          scheduledAds: item.scheduledAds.map((scheduledAd) => {
            const ad = scheduledAd.ad;
            const adData = {
              id: ad.id,
              type: ad.type.toLowerCase(),
              content: { ...ad.content },
              styles: { ...ad.styles },
            };
            return {
              id: scheduledAd.id,
              scheduledTime: scheduledAd.scheduledTime,
              ad: adData,
            };
          }),
          isMerged: item.isMerged,
          rowSpan: item.rowSpan,
          colSpan: item.colSpan,
          mergeDirection: item.mergeDirection,
          selectedCells: item.selectedCells,
        };
      })
      .filter((item) => item !== null); // Remove null entries

    return {
      layoutId: layout.layoutId, // Ensure layoutId is included
      name: layout.name, // Include name if necessary
      rows,
      columns,
      gridItems: filteredItems,
    };
  };

  // Opens the modal for editing a specific ad
  const handleEdit = (index, scheduledAd) => {
    setCurrentAd({ index, scheduledAd });
    setIsEditing(true);
  };

  // Handles saving an updated ad from the modal
  const handleSave = (updatedAdData, updatedScheduledTime) => {
    const updatedGrid = [...gridItems];
    const scheduledAds = updatedGrid[currentAd.index].scheduledAds;
    const adIndex = scheduledAds.findIndex(
      (ad) => ad.id === currentAd.scheduledAd.id,
    );
    if (adIndex !== -1) {
      scheduledAds[adIndex] = {
        ...scheduledAds[adIndex],
        ad: {
          ...scheduledAds[adIndex].ad,
          content: updatedAdData.content,
          styles: updatedAdData.styles,
        },
        scheduledDateTime: updatedScheduledTime,
      };
      updatedGrid[currentAd.index].scheduledAds = scheduledAds;
      setGridItems(updatedGrid);
    }
    setIsEditing(false);
    setCurrentAd(null);
  };

  // Tooltip styles
  const tooltipStyle = {
    backgroundColor: "rgb(255, 255, 255)",
    color: "black",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 1), 0 2px 4px -1px rgba(0, 0, 0, 1)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "14px",
    zIndex: 1000,
  };

  const tooltipPropsRight = {
    className: "custom-tooltip",
    style: tooltipStyle,
    isOpen: showHelp,
    place: "right",
  };
  const tooltipPropsTop = {
    className: "custom-tooltip",
    style: tooltipStyle,
    isOpen: showHelp,
    place: "top",
  };

  // Tooltip information
  const tooltips = {
    addRows: "Click + to add rows",
    remRows: "Click - to remove rows",
    addCols: "Click + to add columns",
    remCols: "Click - to remove columns",
    sidebar: "Drag & drop element to add to grid",
    merge: "Click while selecting multiple cells to merge",
  };

  const isMergeButtonActive =
    selectedCells.length >= 2 || selectedMergedCells.length >= 1;
  const mergeButtonTooltip =
    selectedMergedCells.length === 1
      ? "Click to merge/unmerge selected cells"
      : "Click to merge/unmerge selected cells";

  return (
    <div className="ad-canvas flex w-full flex-col items-center justify-center text-center">
      <div className="absolute right-4 top-[calc(6rem+1rem)] z-10">
        <CircleHelp
          className={`z-0 h-6 w-6 cursor-pointer transition-colors duration-200 ${
            showHelp ? "text-orange-500" : "text-gray-600"
          }`}
          fill={showHelp ? "#FFFFFF" : "#D9D9D9"}
          strokeWidth={2}
          onClick={() => setShowHelp(!showHelp)}
        />
      </div>
      <div className="flex w-full max-w-[80vw] flex-row items-stretch justify-center gap-2">
        {/* Decrease Columns button */}
        <div className="group flex flex-col justify-center">
          <div
            id="remCols"
            data-tooltip-id="remCols-tooltip"
            data-tooltip-content={tooltips.remCols}
            onClick={decreaseColumns}
            className="flex h-5/6 w-4 items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
          >
            <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
              -
            </span>
          </div>
        </div>

        {/* Grid Container with aspect ratio wrapper */}
        <div className="flex w-80 flex-1 flex-col">
          {/* Decrease Rows button */}
          <div className="group py-2">
            <div
              id="remRows"
              data-tooltip-id="remRows-tooltip"
              data-tooltip-content={tooltips.remRows}
              onClick={decreaseRows}
              className="flex h-4 w-full items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
            >
              <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                -
              </span>
            </div>
          </div>

          {/* Aspect ratio container */}
          <div className="relative h-full w-full pb-[56.5%] md:pb-[30%] lg:pb-[45%] 2xl:pb-[50%]">
            {/* Grid cells container */}
            <div
              className="absolute left-0 top-0 grid h-full w-full auto-rows-fr gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows || 3}, minmax(0, 1fr))`,
                gridAutoFlow: "dense",
                "--rows": rows,
                "--columns": columns,
              }}
            >
              {gridItems.map((item, index) => {
                const rowIndex = Math.floor(index / columns);
                const colIndex = index % columns;
                return (
                  <GridCell
                    key={index}
                    index={index}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    item={item}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    onEdit={handleEdit}
                    onMerge={handleMerge}
                    isSelected={selectedCells.includes(index)}
                    onSelect={handleCellSelection}
                    isSelectionMode={isSelectionMode}
                    setIsSelectionMode={setIsSelectionMode}
                    columns={columns}
                    totalCells={totalCells}
                    onUnmerge={handleUnmerge}
                    showHelp={showHelp}
                  />
                );
              })}
            </div>
          </div>

          {/* Increase Rows button */}
          <div className="group py-2">
            <div
              id="addRows"
              data-tooltip-id="addRows-tooltip"
              data-tooltip-content={tooltips.addRows}
              onClick={increaseRows}
              className="flex h-4 w-full items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:h-2 md:overflow-hidden md:group-hover:h-8 lg:h-1"
            >
              <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                +
              </span>
            </div>
          </div>
        </div>

        {/* Increase Columns button */}
        <div className="group flex flex-col justify-center">
          <div
            id="addCols"
            data-tooltip-id="addCols-tooltip"
            data-tooltip-content={tooltips.addCols}
            onClick={increaseColumns}
            className="flex h-5/6 w-4 items-center justify-center rounded-lg bg-gray-300 text-center transition-all duration-200 hover:cursor-pointer hover:bg-gray-400 md:w-2 md:overflow-hidden md:group-hover:w-8 lg:w-1"
          >
            <span className="font-bold md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
              +
            </span>
          </div>
        </div>
      </div>

      {/* Popup when in selection mode */}
      <SelectionModePopup isVisible={isSelectionMode} />

      {/* Sidebar */}
      <Sidebar />

      {/* Navigation buttons */}
      <div className="mx-auto flex w-4/5 flex-row justify-between py-4 lg:py-8">
        <MoveLeft
          onClick={handleMoveLeft}
          className="h-8 w-16 rounded-lg bg-orange-500 py-1 text-white hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-2"
        />

        <div
          id="merge"
          data-tooltip-id="merge-tooltip"
          data-tooltip-content={mergeButtonTooltip}
        >
          <Merge
            onClick={handleMergeSelected}
            disabled={!isMergeButtonActive}
            className={`h-8 w-16 rounded-lg py-2 text-white transition-colors duration-300 sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3.5 ${
              !isMergeButtonActive
                ? "cursor-not-allowed bg-gray-400"
                : "bg-orange-500 hover:cursor-pointer"
            }`}
          />
        </div>

        <Check
          onClick={handleOpenSelector}
          className="h-8 w-16 rounded-lg bg-orange-500 py-1.5 text-white hover:cursor-pointer sm:w-20 md:w-24 xl:h-10 xl:w-28 2xl:h-16 2xl:w-40 2xl:py-3"
        />
      </div>

      {/* Hint/tooltip components */}
      <Tooltip id="sidebar-tooltip" {...tooltipPropsRight} />
      <Tooltip id="merge-tooltip" {...tooltipPropsRight} />
      <Tooltip id="addRows-tooltip" {...tooltipPropsRight} />
      <Tooltip id="remRows-tooltip" {...tooltipPropsTop} />
      <Tooltip id="addCols-tooltip" {...tooltipPropsRight} />
      <Tooltip id="remCols-tooltip" {...tooltipPropsRight} />

      {/* Modals */}
      {isNamingLayout && (
        <SaveLayoutModal
          onSave={handleLayoutNameSave}
          onClose={() => setIsNamingLayout(false)}
        />
      )}
      {isEditing && currentAd && currentAd.scheduledAd && (
        <EditModal
          ad={currentAd.scheduledAd.ad}
          onSave={handleSave}
          onClose={() => {
            setIsEditing(false);
            setCurrentAd(null);
          }}
        />
      )}
      {isScheduling && currentScheduleAd && (
        <ScheduleModal
          ad={currentScheduleAd.item}
          onSave={(scheduledDateTime) =>
            handleScheduleSave(
              currentScheduleAd.item,
              scheduledDateTime,
              currentScheduleAd.index,
            )
          }
          onClose={() => {
            setIsScheduling(false);
            setCurrentScheduleAd(null);
          }}
        />
      )}
    </div>
  );
};

export default AdCanvas;
