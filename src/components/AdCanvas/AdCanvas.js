import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { v4 as uuidv4 } from "uuid";
import "./AdCanvas.css";
import EditModal from "./EditModal.js";

// AdComponent for different ad types
const AdComponent = ({ id, type, content }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "AD_ITEM",
      item: { id, type, content },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, type, content]
  );

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="ad-item"
    >
      {type === "text" && <p>{content.title}</p>}
      {type === "image" && <img src={content.src} alt="Ad" />}
      {type === "video" && (
        <video src={content.src} controls style={{ width: "100%" }} />
      )}
      {type === "clickable" && (
        <button onClick={() => alert("Ad clicked!")}>{content.title}</button>
      )}
    </div>
  );
};

// Grid Cell component where Ads can be dropped
const GridCell = ({
  index,
  onDrop,
  onRemove,
  onEdit,
  onMerge,
  item,
  isSelected,
  onSelect,
  isSelectionMode,
}) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "AD_ITEM",
      drop: (draggedItem) => onDrop(draggedItem, index),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop, index]
  );

  const handleMergeHorizontal = (e) => {
    e.stopPropagation();
    onMerge(index, "horizontal");
  };

  const handleMergeVertical = (e) => {
    e.stopPropagation();
    onMerge(index, "vertical");
  };

  const handleCellClick = (e) => {
    e.stopPropagation();
    if (isSelectionMode && item && !item.isMerged) {
      onSelect(index);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(index);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(index);
  };

  const mergedClass = item?.isMerged
    ? item.mergeDirection === "horizontal"
      ? "merged-horizontal"
      : "merged-vertical"
    : "";

  const selectionClass = isSelectionMode && item ? "selectable" : "";
  const selectedClass = isSelected ? "selected" : "";

  if (item?.hidden) {
    return null;
  }

  return (
    <div
      ref={drop}
      onClick={handleCellClick}
      className={`grid-cell ${isOver ? "hover" : ""} ${mergedClass} ${selectionClass} ${selectedClass}`}
      style={{
        gridRow: item?.rowSpan ? `span ${item.rowSpan}` : "auto",
        gridColumn: item?.colSpan ? `span ${item.colSpan}` : "auto",
        gridArea: item?.isMerged ? item.gridArea : undefined,
      }}
    >
      {item ? (
        <div className="cell-content">
          <AdComponent id={item.id} type={item.type} content={item.content} />
          <div className="actions">
            <button className="edit-button" onClick={handleEdit}>Edit</button>
            {!item.isMerged && !isSelectionMode && (
              <>
                <button className="merge-button" onClick={handleMergeHorizontal}>
                  Merge Horizontally
                </button>
                <button className="merge-button" onClick={handleMergeVertical}>
                  Merge Vertically
                </button>
              </>
            )}
            <button className="remove-button" onClick={handleRemove}>Remove</button>
          </div>
        </div>
      ) : (
        <p>Drop ad here</p>
      )}
    </div>
  );
};

// Sidebar for draggable ad components
const Sidebar = () => {
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

// The main Canvas component
const AdCanvas = () => {
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const totalCells = rows * columns; // Calculate total cells based on rows and columns
  const [gridItems, setGridItems] = useState(Array(totalCells).fill(null)); // Initialize grid items
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Function to resize the grid based on new dimensions
  const resizeGrid = (newRows, newColumns) => {
    const newTotalCells = newRows * newColumns;
    const updatedGrid = Array(newTotalCells).fill(null);

    // Copy existing items to the new grid
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
      const updatedGrid = [...gridItems];

      // Clear the last row cells
      for (let col = 0; col < columns; col++) {
        const indexToClear = newRows * columns + col; // Calculate index for the last row
        if (indexToClear < updatedGrid.length) {
          updatedGrid[indexToClear] = null; // Clear the cell
        }
      }

      // Update grid items and rows
      setGridItems(updatedGrid);
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

  // Handle merging of cells
  const handleMerge = (index, direction, selectedCells = []) => {
    const updatedGrid = [...gridItems];
  
    if (!updatedGrid[index] || updatedGrid[index]?.isMerged) {
      alert("Cannot merge empty or already merged cells!");
      return;
    }
  
    if (selectedCells.length > 0) {
      const firstType = updatedGrid[selectedCells[0]]?.type;
    
      // Calculate row and column indices
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
        const mergedItem = {
          ...updatedGrid[selectedCells[0]],
          isMerged: true,
          rowSpan,
          colSpan,
          mergeDirection: "selection",
          selectedCells,
          content: {
            title: selectedCells
              .map((idx) => updatedGrid[idx]?.content.title)
              .join(" "),
          },
          gridArea: `${Math.min(...rowIndices) + 1} / ${
            Math.min(...colIndices) + 1
          } / span ${rowSpan} / span ${colSpan}`,
        };
    
        updatedGrid[selectedCells[0]] = mergedItem;
    
        selectedCells.slice(1).forEach((cellIndex) => {
          updatedGrid[cellIndex] = { isMerged: true, hidden: true };
        });
      } else {
        alert(
          "Selected cells must form a proper rectangle, be of the same type, and not already merged!"
        );
        return;
      }
    } else if (direction === "horizontal") {
      const numColumns = columns;
      const rowStart = Math.floor(index / numColumns) * numColumns;
      const rowEnd = rowStart + numColumns - 1;

      if (
        index < rowEnd &&
        updatedGrid[index + 1] &&
        updatedGrid[index].type === updatedGrid[index + 1].type
      ) {
        const mergedItem = {
          ...updatedGrid[index],
          isMerged: true,
          colSpan: 2, // Merge spans 2 columns
          mergeDirection: "horizontal",
          content: `${updatedGrid[index].content.title} ${
            updatedGrid[index + 1].content.title
          }`,
        };

        updatedGrid[index] = mergedItem;
        updatedGrid[index + 1] = { isMerged: true, hidden: true };
      } else {
        alert(
          "Cannot merge horizontally. Cells must be adjacent and of the same type."
        );
      }
    } else if (direction === "vertical") {
      const numColumns = columns;
      const bottomIndex = index + numColumns;

      if (
        bottomIndex < totalCells &&
        updatedGrid[bottomIndex] &&
        updatedGrid[index].type === updatedGrid[bottomIndex].type &&
        !updatedGrid[bottomIndex]?.isMerged
      ) {
        const mergedItem = {
          ...updatedGrid[index],
          isMerged: true,
          rowSpan: 2, // Merge spans 2 rows
          mergeDirection: "vertical",
          content: `${updatedGrid[index].content.title} ${updatedGrid[bottomIndex].content.title}`,
        };

        updatedGrid[index] = mergedItem;
        updatedGrid[bottomIndex] = { isMerged: true, hidden: true };
      } else {
        alert(
          "Cannot merge vertically. Cells must be adjacent and of the same type."
        );
      }
    }

    setGridItems(updatedGrid);
  };

  const handleCellSelection = (index) => {
    if (!isSelectionMode) return;

    setSelectedCells((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleMergeSelected = () => {
    if (selectedCells.length < 2) {
      alert("Please select at least 2 cells to merge");
      return;
    }
    handleMerge(selectedCells[0], "selection", selectedCells);
    setSelectedCells([]);
    setIsSelectionMode(false);
  };

  // Handles dropping an ad into a specific grid cell
  const handleDrop = (item, index) => {
    const updatedGrid = [...gridItems];
    const newItem = { ...item, id: uuidv4() }; // Generate a unique ID using uuid
    updatedGrid[index] = newItem; // Allow overriding of ads
    setGridItems(updatedGrid);
  };

  // Removes the ad from the specified index (grid cell)
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
      } else if (mergeDirection === "horizontal") {
        const colSpan = updatedGrid[index].colSpan || 1;
        for (let i = 0; i < colSpan; i++) {
          if (updatedGrid[index + i]?.isMerged) {
            updatedGrid[index + i] = null; // Remove each cell in the merged group
          }
        }
      } else if (mergeDirection === "vertical") {
        const rowSpan = updatedGrid[index].rowSpan || 1;
        for (let i = 0; i < rowSpan; i++) {
          const cellBelowIndex = index + i * columns;
          if (updatedGrid[cellBelowIndex]?.isMerged) {
            updatedGrid[cellBelowIndex] = null; // Remove each cell in the merged group
          }
        }
      }
    } else {
      // If the cell is not merged, simply set it to null
      updatedGrid[index] = null;
    }

    // Ensure the grid always has totalCells elements
    const nullCells = updatedGrid.filter((item) => item === null).length;
    if (nullCells > 0 && updatedGrid.length > totalCells) {
      updatedGrid.length = totalCells; // Trim excess cells
    }

    setGridItems(updatedGrid);
  };

  const handleSaveLayout = () => {
    const layoutJSON = JSON.stringify(gridItems, null, 2); // Format gridItems as JSON
    console.log("Current Layout JSON:", layoutJSON); // Log to console
    alert(layoutJSON); // Show JSON in an alert (or use the Notification component)
  };

  // Opens the edit modal
  const handleEdit = (index) => {
    setCurrentAd({ index, item: gridItems[index] });
    setIsEditing(true); // This will now be handled by the modal component
  };

  // Handles save action from the modal
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
        {gridItems.map((item, index) => (
          <GridCell
            key={index}
            index={index}
            item={item}
            onDrop={handleDrop}
            onRemove={handleRemove}
            onEdit={handleEdit}
            onMerge={handleMerge}
            isSelected={selectedCells.includes(index)}
            onSelect={handleCellSelection}
            isSelectionMode={isSelectionMode}
          />
        ))}
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
          ad={currentAd.item} // Pass the current ad item directly
          onSave={handleSave}
          onClose={() => {
            setIsEditing(false);
            setCurrentAd(null); // Reset current ad
          }}
        />
      )}
    </div>
  );
};

export default AdCanvas;
