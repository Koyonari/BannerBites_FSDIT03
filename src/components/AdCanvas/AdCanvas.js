// AdCanvas.js
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from 'axios'; 
import "./AdCanvas.css";
import Sidebar from "./Sidebar";
import GridCell from "./GridCell";
import EditModal from "./EditModal";
import ScheduleModal from "./ScheduleModal";

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
      }
    }

    if (indicesToMerge.length > 0) {
      // Combine scheduledAds from the cells being merged
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
          scheduledAds: [], // Ensure scheduledAds is initialized
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
    if (!isSelectionMode) return;

    setSelectedCells((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  // Handle merging for selected cells
  const handleMergeSelected = () => {
    if (selectedCells.length < 2) {
      alert("Please select at least 2 cells to merge");
      return;
    }
    handleMerge(selectedCells[0], "selection", selectedCells);
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
    // Open the scheduling modal
    setCurrentScheduleAd({ item, index });
    setIsScheduling(true);
  };
  // Handles saving a scheduled ad
  const handleScheduleSave = (adItem, scheduledDateTime, index) => {
    const updatedGrid = [...gridItems];
    const scheduledAd = {
      id: uuidv4(),
      ad: { ...adItem, id: uuidv4() },
      scheduledDateTime,
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

  // Handles saving the current layout as a JSON object
  const handleSaveLayout = async () => {
    try {
      // Generate a unique layoutId
      const layoutId = uuidv4();

      // Construct the layout object
      const layout = { rows, columns, gridItems, layoutId, name: "Main Layout" }; // You can customize the 'name' as needed

      // Clean the layout JSON
      const cleanedLayout = cleanLayoutJSON(layout);

      // Send the layout to the backend
      const response = await axios.post('http://localhost:5000/api/saveLayout', cleanedLayout, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Layout saved successfully:", response.data);
      alert("Layout saved successfully!");
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
              scheduledDateTime: scheduledAd.scheduledDateTime,
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
  const handleSave = (updatedAdData, updatedScheduledDateTime) => {
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
        scheduledDateTime: updatedScheduledDateTime, // Update scheduled time
      };
      updatedGrid[currentAd.index].scheduledAds = scheduledAds;
      setGridItems(updatedGrid);
    }
    setIsEditing(false);
    setCurrentAd(null);
  };

  return (
    <div className="ad-canvas flex flex-col items-center justify-center text-center w-full">
      <div className="flex flex-row items-stretch gap-2 w-full max-h-[80vh] max-w-[80vw] justify-center">
        {/* Decrease Columns button */}
        <div className="flex flex-col justify-center group">
          <div
            onClick={decreaseColumns}
            className="bg-gray-300 text-center rounded-lg w-4 md:w-2 lg:w-1 h-5/6 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:w-8 transition-all duration-200 md:overflow-hidden"
          >
            <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200">
              -
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col w-80 max-h-[80h]">
          {/* Increase Rows button */}
          <div className="group py-2">
            <div
              onClick={increaseRows}
              className="w-full bg-gray-300 text-center rounded-lg h-4 md:h-2 lg:h-1 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:h-8 transition-all duration-200 md:overflow-hidden
    "
            >
              <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200">
                +
              </span>
            </div>
          </div>

          {/* Grid cells */}
          <div
            className="grid flex-1 max-h-[60vh]"
            style={{
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
                  columns={columns}
                  totalCells={totalCells}
                  onUnmerge={handleUnmerge}
                />
              );
            })}
          </div>

          {/* Decrease Rows button */}
          <div className="group py-2">
            <div
              onClick={decreaseRows}
              className="w-full bg-gray-300 text-center rounded-lg h-4 md:h-2 lg:h-1 hover:cursor-pointer hover:bg-gray-400 flex items-center justify-center md:group-hover:h-8 transition-all duration-200 md:overflow-hidden"
            >
              <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200">
                -
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
            <span className="md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200">
              +
            </span>
          </div>
        </div>
      </div>

      <Sidebar />

      <div className="controls">
        <button onClick={handleSaveLayout}>Save Layout</button>;
        <button onClick={() => setIsSelectionMode(!isSelectionMode)}>
          {isSelectionMode ? "Exit Selection Mode" : "Enter Selection Mode"}
        </button>
        {isSelectionMode && (
          <button
            onClick={handleMergeSelected}
            disabled={selectedCells.length < 2}
          >
            Merge Selected ({selectedCells.length})
          </button>
        )}
      </div>
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
