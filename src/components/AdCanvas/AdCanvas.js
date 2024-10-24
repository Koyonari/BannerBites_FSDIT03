import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { v4 as uuidv4 } from "uuid";
import "./AdCanvas.css";
import EditModal from "./EditModal.js";

// AdComponent represents individual ads that can be dragged
const AdComponent = ({ id, type, content, styles }) => {
  // useDrag hook from react-dnd to enable drag functionality
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "AD_ITEM", // Specifies the type of item for the drop target
      item: { id, type, content, styles }, // Data associated with the item being dragged
      collect: (monitor) => ({
        isDragging: monitor.isDragging(), // Boolean flag for dragging state
      }),
    }),
    [id, type, content, styles]
  );

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1, // Make ad semi-transparent when dragging
        borderColor: styles?.borderColor || "black",
        borderStyle: "solid",
        borderWidth: "1px",
      }}
      className="ad-item"
    >
      {type === "text" && (
        <p
          style={{
            fontFamily: styles?.font || "Arial",
            fontSize: styles?.fontSize || "14px",
            color: styles?.textColor || "black",
          }}
        >
          {content.title}
        </p>
      )}
      {type === "image" && (
        <img
          src={content.src}
          alt="Ad"
          style={{
            borderColor: styles?.borderColor || "black",
            borderStyle: "solid",
            borderWidth: "1px",
          }}
        />
      )}
      {type === "video" && (
        <video
          src={content.src}
          controls
          style={{
            width: "100%",
            borderColor: styles?.borderColor || "black",
            borderStyle: "solid",
            borderWidth: "1px",
          }}
        />
      )}
      {type === "clickable" && (
        <button
          onClick={() => alert("Ad clicked!")}
          style={{
            fontFamily: styles?.font || "Arial",
            fontSize: styles?.fontSize || "14px",
            color: styles?.textColor || "black",
          }}
        >
          {content.title}
        </button>
      )}
    </div>
  );
};

// GridCell represents individual cells in the grid where ads can be dropped
const GridCell = ({
  index,
  rowIndex,
  colIndex,
  onDrop,
  onRemove,
  onEdit,
  onMerge,
  item,
  isSelected,
  onSelect,
  isSelectionMode,
}) => {
  // useDrop hook from react-dnd to enable drop functionality
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

  // Merge handlers
  const handleMergeHorizontal = (e) => {
    e.stopPropagation(); // Prevent parent click events
    onMerge(index, "horizontal");
  };

  const handleMergeVertical = (e) => {
    e.stopPropagation(); // Prevent parent click events
    onMerge(index, "vertical");
  };

  // Handle selecting cells for merging
  const handleCellClick = (e) => {
    e.stopPropagation();
    if (isSelectionMode && item && !item.isMerged) {
      onSelect(index);
    }
  };

  // Handlers for removing and editing cells
  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(index);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(index);
  };

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
        gridArea: item?.isMerged ? item.gridArea : undefined,
      }}
    >
      {item ? (
        <div className="cell-content">
          <AdComponent
            id={item.id}
            type={item.type}
            content={item.content}
            styles={item.styles}
          />
          <div className="actions">
            <button className="edit-button" onClick={handleEdit}>
              Edit
            </button>
            {!item.isMerged && !isSelectionMode && (
              <>
                <button
                  className="merge-button"
                  onClick={handleMergeHorizontal}
                >
                  Merge Horizontally
                </button>
                <button className="merge-button" onClick={handleMergeVertical}>
                  Merge Vertically
                </button>
              </>
            )}
            <button className="remove-button" onClick={handleRemove}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <p>Drop ad here</p>
      )}
    </div>
  );
};

// Sidebar component showing available ad options
const Sidebar = () => {
  // Define different ad options available for dragging
  const adOptions = [
    {
      type: "text",
      content: { title: "Text Ad", description: "This is a text ad." },
    },
    {
      type: "image",
      content: {
        src: "https://via.placeholder.com/150",
        title: "Image Ad",
        description: "This is an image ad.",
      },
    },
    {
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad.",
      },
    },
    {
      type: "clickable",
      content: { title: "Click Me", description: "This is a clickable ad." },
    },
  ];

  return (
    <div className="sidebar">
      <h3>Ad Options</h3>
      {adOptions.map((ad, index) => (
        <AdComponent
          key={index}
          id={`sidebar-${ad.type}-${index}`}
          type={ad.type}
          content={ad.content}
        />
      ))}
    </div>
  );
};

// The main AdCanvas component containing the grid and ads
const AdCanvas = () => {
  // State for grid dimensions, ad items, editing state, selection mode, etc.
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const totalCells = rows * columns;
  const [gridItems, setGridItems] = useState(Array(totalCells).fill(null));
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Resizes the grid based on new dimensions
  const resizeGrid = (newRows, newColumns) => {
    const newTotalCells = newRows * newColumns;
    const updatedGrid = Array(newTotalCells).fill(null);

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
      alert(
        `Cannot merge ${direction}. Cells must be adjacent and of the same type.`
      );
      return;
    }

    // Handling merging for selection mode
    if (selectedCells.length > 0) {
      // Logic for handling selected cells
      // Ensures selected cells are rectangular, valid, and of the same type
      const firstType = updatedGrid[selectedCells[0]]?.type;
      const rowIndices = selectedCells.map((cellIndex) =>
        Math.floor(cellIndex / columns)
      );
      const colIndices = selectedCells.map((cellIndex) => cellIndex % columns);
      const rowSpan = Math.max(...rowIndices) - Math.min(...rowIndices) + 1;
      const colSpan = Math.max(...colIndices) - Math.min(...colIndices) + 1;
      const totalExpectedCells = rowSpan * colSpan;
      
      const isRectangular =
        totalExpectedCells === selectedCells.length &&
        new Set(rowIndices).size === rowSpan &&
        new Set(colIndices).size === colSpan;

      const validSelection = selectedCells.every(
        (cellIndex) =>
          updatedGrid[cellIndex] &&
          updatedGrid[cellIndex].type === firstType &&
          !updatedGrid[cellIndex].isMerged
      );

      if (validSelection && isRectangular) {
        // Create merged item with consolidated properties
        const mergedItem = {
          id: updatedGrid[selectedCells[0]].id,
          type: updatedGrid[selectedCells[0]].type,
          content: updatedGrid[selectedCells[0]].content, // Only keep relevant content information
          styles: updatedGrid[selectedCells[0]].styles, // Move styles here if they are not already
          isMerged: true,
          rowSpan,
          colSpan,
          mergeDirection: "selection",
          selectedCells,
          gridArea: `${Math.min(...rowIndices) + 1} / ${Math.min(...colIndices) + 1} / span ${rowSpan} / span ${colSpan}`,
        };
  
        updatedGrid[selectedCells[0]] = mergedItem;
        selectedCells.slice(1).forEach((cellIndex) => {
          updatedGrid[cellIndex] = { isMerged: true, hidden: true };
        });
      } else {
        alert("Selected cells must form a proper rectangle, be of the same type, and not already merged!");
        return;
      }
    }else if (direction === "horizontal" || direction === "vertical") {
      // Logic for directional merge (horizontal or vertical)
      const numColumns = columns;
      let indicesToMerge = [];

      if (direction === "horizontal") {
        const rowStart = Math.floor(index / numColumns) * numColumns;
        const rowEnd = rowStart + numColumns - 1;

        if (
          index < rowEnd &&
          updatedGrid[index + 1] &&
          updatedGrid[index].type === updatedGrid[index + 1].type
        ) {
          indicesToMerge = [index, index + 1];
        }
      } else if (direction === "vertical") {
        const bottomIndex = index + numColumns;
        if (
          bottomIndex < totalCells &&
          updatedGrid[bottomIndex] &&
          updatedGrid[index].type === updatedGrid[bottomIndex].type
        ) {
          indicesToMerge = [index, bottomIndex];
        }
      }

      if (indicesToMerge.length > 0) {
        const mergedItem = {
          ...updatedGrid[index],
          isMerged: true,
          rowSpan: direction === "vertical" ? 2 : 1,
          colSpan: direction === "horizontal" ? 2 : 1,
          mergeDirection: direction,
          content: indicesToMerge
            .map((idx) => updatedGrid[idx]?.content.title)
            .join(" "),
        };

        updatedGrid[indicesToMerge[0]] = mergedItem;
        indicesToMerge.slice(1).forEach((cellIndex) => {
          updatedGrid[cellIndex] = { isMerged: true, hidden: true };
        });
      } else {
        alert(
          `Cannot merge ${direction}. Cells must be adjacent and of the same type.`
        );
      }
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

  // Handles dropping an ad into a grid cell
  const handleDrop = (item, index, rowIndex, colIndex) => {
    const updatedGrid = [...gridItems];
    const newItem = { ...item, id: uuidv4(), rowIndex, colIndex };
    updatedGrid[index] = newItem;
    setGridItems(updatedGrid);
  };

  // Handles removing ads from a grid cell
  const handleRemove = (index) => {
    const updatedGrid = [...gridItems];

    if (updatedGrid[index]?.isMerged) {
      const mergeDirection = updatedGrid[index].mergeDirection;

      if (mergeDirection === "selection") {
        // For selection merges, clear all selected cells if they exist
        if (Array.isArray(updatedGrid[index]?.selectedCells)) {
          updatedGrid[index].selectedCells.forEach((cellIndex) => {
            if (cellIndex !== undefined && updatedGrid[cellIndex]) {
              updatedGrid[cellIndex] = null;
            }
          });
        } else {
          console.error("Error: selectedCells is undefined or not an array");
        }
      } else {
        // For directional merges, handle each merged cell based on direction
        const isHorizontal = mergeDirection === "horizontal";
        const span = isHorizontal
          ? updatedGrid[index].colSpan
          : updatedGrid[index].rowSpan;

        for (let i = 0; i < span; i++) {
          const cellIndex = isHorizontal ? index + i : index + i * columns;
          if (updatedGrid[cellIndex]?.isMerged) {
            updatedGrid[cellIndex] = null;
          }
        }
      }
    } else {
      // If the cell is not merged, simply set it to null
      updatedGrid[index] = null;
    }

    // Update grid state
    setGridItems(updatedGrid);
  };

  // Function to clean the layout JSON by removing hidden cells
  // Function to clean the layout JSON by removing hidden cells and ensuring valid items
  const cleanLayoutJSON = (layout) => {
    const { rows, columns, gridItems } = layout;

    // Filter out hidden items and any null or undefined items
    const filteredItems = gridItems.filter((item) => item && !item.hidden);

    return {
      rows,
      columns,
      gridItems: filteredItems.map((item) => ({
        ...item,
        styles: item.styles, // Ensure styles are included in the JSON
      })),
    };
  };

  // Handles saving the current layout as a JSON object
  const handleSaveLayout = () => {
    // Create the initial layout JSON with all cells
    const layout = { rows, columns, gridItems };

    // Clean the layout by removing hidden cells
    const cleanedLayout = cleanLayoutJSON(layout);

    // Convert to JSON string for displaying or saving
    const layoutJSON = JSON.stringify(cleanedLayout, null, 2);
    console.log("Current Layout JSON:", layoutJSON);
    alert(layoutJSON);
  };

  // Opens the modal for editing a specific ad
  const handleEdit = (index) => {
    setCurrentAd({ index, item: gridItems[index] });
    setIsEditing(true);
  };

  // Handles saving an updated ad from the modal
  const handleSave = (updatedContent) => {
    const updatedGrid = [...gridItems];
    updatedGrid[currentAd.index] = {
      ...updatedGrid[currentAd.index],
      content: updatedContent,
    };
    setGridItems(updatedGrid);
    setIsEditing(false);
  };

  return (
    <div className="ad-canvas">
      <Sidebar />
      <div>
        <button onClick={increaseRows}>Increase Rows</button>
        <button onClick={decreaseRows}>Decrease Rows</button>
        <button onClick={increaseColumns}>Increase Columns</button>
        <button onClick={decreaseColumns}>Decrease Columns</button>
      </div>
      <div
        className="grid"
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
            />
          );
        })}
      </div>
      <div className="controls">
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
      <button onClick={handleSaveLayout}>Save Layout</button>
      {isEditing && currentAd && currentAd.item && (
        <EditModal
          ad={currentAd.item}
          onSave={handleSave}
          onClose={() => {
            setIsEditing(false);
            setCurrentAd(null);
          }}
        />
      )}
    </div>
  );
};

export default AdCanvas;
