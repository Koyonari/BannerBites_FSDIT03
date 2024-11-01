import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import Sidebar from "./Sidebar";
import GridCell from "./GridCell";
import EditModal from "./EditModal";
import ScheduleModal from "./ScheduleModal";
import SaveLayoutModal from "./SaveLayoutModal";
import { MoveLeft, Merge, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdCanvas = () => {
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
    }))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
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

  // Resizes the grid based on new dimensions
  const resizeGrid = (newRows, newColumns) => {
    const newTotalCells = newRows * newColumns;
    const updatedGrid = Array.from({ length: newTotalCells }, () => ({
      scheduledAds: [], // Changed from ad: null
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

  // Functions to increase or decrease grid rows and columns
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

  // Handle merging of cells, including direction and selection
  const handleMerge = (index, direction, selectedCells = []) => {
    const updatedGrid = [...gridItems];

    if (!updatedGrid[index] || updatedGrid[index]?.isMerged) {
      alert("Cannot merge empty or already merged cells!");
      return;
    }

    const numColumns = columns;
    let indicesToMerge = [];

    if (selectedCells.length > 0) {
      // Handle selection-based merging
      indicesToMerge = selectedCells;
    } else if (direction === "horizontal" || direction === "vertical") {
      // Handle directional merging
      if (direction === "horizontal") {
        if ((index + 1) % numColumns === 0) {
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
        const bottomIndex = index + numColumns;
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
      const mergedScheduledAds = indicesToMerge.reduce((ads, idx) => {
        return ads.concat(updatedGrid[idx].scheduledAds || []);
      }, []);

      const mergedItem = {
        scheduledAds: mergedScheduledAds,
        isMerged: true,
        hidden: false,
        rowSpan:
          selectedCells.length > 0
            ? Math.max(
                ...selectedCells.map((idx) => Math.floor(idx / columns))
              ) -
              Math.min(
                ...selectedCells.map((idx) => Math.floor(idx / columns))
              ) +
              1
            : direction === "vertical"
            ? 2
            : 1,
        colSpan:
          selectedCells.length > 0
            ? Math.max(...selectedCells.map((idx) => idx % columns)) -
              Math.min(...selectedCells.map((idx) => idx % columns)) +
              1
            : direction === "horizontal"
            ? 2
            : 1,
        mergeDirection: direction || "selection",
        selectedCells:
          selectedCells.length > 0 ? selectedCells : indicesToMerge,
      };

      updatedGrid[indicesToMerge[0]] = mergedItem;

      indicesToMerge.slice(1).forEach((cellIndex) => {
        updatedGrid[cellIndex] = {
          scheduledAds: [],
          isMerged: true,
          hidden: true,
          rowSpan: 1,
          colSpan: 1,
        };
      });
    } else {
      alert("Cannot merge the selected cells.");
      return;
    }

    setGridItems(updatedGrid);
  };

  // Handles selecting cells for merging
  const handleCellSelection = (index) => {
    const cell = gridItems[index];
    if (cell.hidden || cell.isMerged) {
      return;
    }

    setSelectedCells((prev) => {
      if (prev.includes(index)) {
        const newSelection = prev.filter((i) => i !== index);
        if (newSelection.length === 0) {
          setIsSelectionMode(false); // Exit selection mode if no cells are selected
        }
        return newSelection;
      }
      return [...prev, index];
    });
  };

  // Helper function to check if selected cells form a rectangle
  const isRectangleShape = (selectedCells) => {
    const rows = selectedCells.map((index) => Math.floor(index / columns));
    const cols = selectedCells.map((index) => index % columns);

    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Check if cells fill the rectangle area completely
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * columns + col;
        if (!selectedCells.includes(index)) {
          return false;
        }
      }
    }
    return true;
  };

  // Update handleMergeSelected to validate rectangle shape
  const handleMergeSelected = () => {
    if (selectedCells.length < 2) {
      alert("Please select at least 2 cells to merge.");
      return;
    }

    // Validate that selected cells form a valid rectangle
    if (!isRectangleShape(selectedCells)) {
      alert("Selected cells must form a rectangle or square and be adjacent.");
      setSelectedCells([]); // Clear selection
      setIsSelectionMode(false);
      return;
    }

    // Validate that the selected cells are in a single row or column or form a valid rectangle.
    const isValidMerge = validateMerge(selectedCells);
    if (!isValidMerge) {
      alert(
        "Invalid merge. Please select contiguous cells in a row, column, or valid rectangular block."
      );
      return;
    }

    const sortedCells = [...selectedCells].sort((a, b) => a - b);
    handleMerge(sortedCells[0], "selection", sortedCells);
    setSelectedCells([]);
    setIsSelectionMode(false);
  };

  // New function to validate selected cells for merging
  const validateMerge = (selectedCells) => {
    if (selectedCells.length <= 1) {
      return false; // Cannot merge a single cell
    }

    const rows = selectedCells.map((index) => Math.floor(index / columns));
    const cols = selectedCells.map((index) => index % columns);

    // Check if all cells are in the same row
    const allInSameRow = rows.every((row) => row === rows[0]);
    if (allInSameRow) {
      // Ensure they are adjacent in the row
      const sortedCols = [...cols].sort((a, b) => a - b);
      for (let i = 1; i < sortedCols.length; i++) {
        if (sortedCols[i] !== sortedCols[i - 1] + 1) {
          return false; // There is a gap in the selected cells
        }
      }
      return true;
    }

    // Check if all cells are in the same column
    const allInSameColumn = cols.every((col) => col === cols[0]);
    if (allInSameColumn) {
      // Ensure they are adjacent in the column
      const sortedRows = [...rows].sort((a, b) => a - b);
      for (let i = 1; i < sortedRows.length; i++) {
        if (sortedRows[i] !== sortedRows[i - 1] + 1) {
          return false; // There is a gap in the selected cells
        }
      }
      return true;
    }

    // Check if cells form a valid rectangular block
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // Validate that all cells within this rectangle are selected
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const index = row * columns + col;
        if (!selectedCells.includes(index)) {
          return false; // Missing cell within the rectangular block
        }
      }
    }

    return true; // The cells form a valid rectangular block
  };

  const handleUnmerge = (index) => {
    const updatedGrid = [...gridItems];
    const cell = updatedGrid[index];

    if (cell.isMerged) {
      const cellsToUnmerge =
        cell.selectedCells && cell.selectedCells.length > 0
          ? cell.selectedCells
          : [index];

      // Distribute scheduledAds equally among unmerged cells or keep them in the first cell
      const scheduledAds = cell.scheduledAds;

      cellsToUnmerge.forEach((idx, idxIndex) => {
        updatedGrid[idx] = {
          scheduledAds: idxIndex === 0 ? scheduledAds : [], // Keep ads in the first cell
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
    // Ensure the item has the required structure
    const normalizedItem = {
      id: item.id || uuidv4(),
      type: item.type || "default",
      content: item.content || item, // If content doesn't exist, use the entire item as content
      styles: item.styles || {},
    };

    setCurrentScheduleAd({ item: normalizedItem, index });
    setIsScheduling(true);
  };

  const handleScheduleSave = (adItem, scheduledTime, index) => {
    const updatedGrid = [...gridItems];

    // Create a properly structured scheduled ad
    const scheduledAd = {
      id: uuidv4(),
      ad: {
        id: adItem.id || uuidv4(),
        type: adItem.type || "default",
        content: adItem.content || adItem,
        styles: adItem.styles || {},
      },
      scheduledTime,
    };

    // Ensure the scheduledAds array exists
    if (!updatedGrid[index].scheduledAds) {
      updatedGrid[index].scheduledAds = [];
    }

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
        (ad) => ad.id !== scheduledAd.id
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
        }
      );

      console.log("Layout saved successfully:", response.data);
      setIsNamingLayout(false);
      navigate("/ad-viewer"); // Navigate to ad-viewer after saving
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
              type: ad.type,
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
      (ad) => ad.id === currentAd.scheduledAd.id
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

  return (
    <div className="ad-canvas flex flex-col items-center justify-center text-center w-full h-full">
      <div className="flex flex-row items-stretch gap-2 w-full h-[70vh] max-w-[80vw] justify-center">
        {/* Decrease Columns button */}
        <div className="flex flex-col justify-center group">
          <div
            onClick={decreaseColumns}
            className="bg-gray-300 text-center rounded-lg w-4 md:w-2 lg:w-1 h-5/6 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:w-8 transition-all duration-200 md:overflow-hidden"
          >
            <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 font-bold">
              -
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col w-80 max-h-[80h]">
          {/* Decrease Rows button */}
          <div className="group py-2">
            <div
              onClick={decreaseRows}
              className="w-full bg-gray-300 text-center rounded-lg h-4 md:h-2 lg:h-1 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:h-8 transition-all duration-200 md:overflow-hidden"
            >
              <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 font-bold">
                -
              </span>
            </div>
          </div>

          {/* Grid cells */}
          <div
            className="grid flex-1 h-[60vh] gap-2.5 w-full auto-rows-[minmax(150px,auto)]"
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
                />
              );
            })}
          </div>

          {/* Increase Rows button */}
          <div className="group py-2">
            <div
              onClick={increaseRows}
              className="w-full bg-gray-300 text-center rounded-lg h-4 md:h-2 lg:h-1 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:h-8 transition-all duration-200 md:overflow-hidden"
            >
              <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 font-bold">
                +
              </span>
            </div>
          </div>
        </div>

        {/* Increase Columns button */}
        <div className="flex flex-col justify-center group">
          <div
            onClick={increaseColumns}
            className="bg-gray-300 text-center rounded-lg w-4 md:w-2 lg:w-1 h-5/6 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:w-8 transition-all duration-200 md:overflow-hidden"
          >
            <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 font-bold">
              +
            </span>
          </div>
        </div>
      </div>
      <Sidebar />

      {/* Add navigation buttons */}
      <div className="flex flex-row justify-between py-4 lg:py-8 w-4/5 mx-auto">
        <MoveLeft
          onClick={handleMoveLeft}
          className="h-8 text-white bg-orange-500 rounded-lg py-1 w-24 hover:cursor-pointer"
        />
        <Merge
          onClick={handleMergeSelected}
          disabled={selectedCells.length < 2}
          className={`h-8 text-white rounded-lg py-2 w-24 transition-colors duration-300 ${
            selectedCells.length < 2
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:cursor-pointer"
          }`}
        />

        <Check
          onClick={handleOpenSelector}
          className="h-8 text-white bg-orange-500 rounded-lg py-1.5 w-24 hover:cursor-pointer"
        />
      </div>

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
              currentScheduleAd.index
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
