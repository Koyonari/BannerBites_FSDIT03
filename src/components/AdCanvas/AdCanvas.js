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
  isSelectionMode 
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
    >
      {item ? (
        <div className="cell-content">
          <AdComponent id={item.id} type={item.type} content={item.content} />
          <div className="actions">
            <button className="edit-button" onClick={handleEdit}>
              Edit
            </button>
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
// The main Canvas component
const AdCanvas = ({ rows = 2, columns = 3 }) => {
  const totalCells = rows * columns; // Calculate total cells based on rows and columns
  const [gridItems, setGridItems] = useState(Array(totalCells).fill(null)); // Initialize grid items
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Handle merging of cells
  const handleMerge = (index, direction, selectedCells = []) => {
    const updatedGrid = [...gridItems];

    if (!updatedGrid[index] || updatedGrid[index]?.isMerged) {
      alert("Cannot merge empty or already merged cells!");
      return;
    }

    if (selectedCells.length > 0) {
      const firstType = updatedGrid[selectedCells[0]]?.type;
      const validSelection = selectedCells.every(cellIndex => 
        updatedGrid[cellIndex] && 
        updatedGrid[cellIndex].type === firstType &&
        !updatedGrid[cellIndex].isMerged
      );

      if (validSelection) {
        const mergedItem = {
          ...updatedGrid[selectedCells[0]],
          isMerged: true,
          span: selectedCells.length,
          mergeDirection: 'selection',
          selectedCells: selectedCells,
          content: {
            title: selectedCells.map(idx => updatedGrid[idx]?.content.title).join(' '),
          }
        };

        updatedGrid[selectedCells[0]] = mergedItem;
        selectedCells.slice(1).forEach(cellIndex => {
          updatedGrid[cellIndex] = { isMerged: true, hidden: true };
        });
      } else {
        alert("Selected cells must be of the same type and not empty or merged!");
        return;
      }
    }
    // Horizontal and vertical merging logic remains unchanged
    else if (direction === "horizontal") {
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
          span: 2,
          mergeDirection: "horizontal",
          content: {
            title: `${updatedGrid[index].content.title} ${updatedGrid[index + 1].content.title}`
          }
        };

        updatedGrid[index] = mergedItem;
        updatedGrid[index + 1] = { isMerged: true, hidden: true };
      }
    }
    else if (direction === "vertical") {
      const numColumns = columns;
      const bottomIndex = index + numColumns;

      if (
        bottomIndex < totalCells && 
        updatedGrid[bottomIndex] &&
        updatedGrid[index].type === updatedGrid[bottomIndex].type
      ) {
        const mergedItem = {
          ...updatedGrid[index],
          isMerged: true,
          span: 2,
          mergeDirection: "vertical",
          content: {
            title: `${updatedGrid[index].content.title} ${updatedGrid[bottomIndex].content.title}`
          }
        };

        updatedGrid[index] = mergedItem;
        updatedGrid[bottomIndex] = { isMerged: true, hidden: true };
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
        // For selection merges, clear all selected cells
        updatedGrid[index].selectedCells.forEach(cellIndex => {
          updatedGrid[cellIndex] = null;
        });
      } else if (mergeDirection === "horizontal") {
        updatedGrid[index] = null;
        updatedGrid[index + 1] = null;
      } else if (mergeDirection === "vertical") {
        updatedGrid[index] = null;
        updatedGrid[index + columns] = null;
      }
    } else {
      updatedGrid[index] = null;
    }

    // Ensure grid always has exactly totalCells elements
    const nullCells = updatedGrid.filter(item => item === null).length;
    if (nullCells < totalCells) {
      const additionalCellsNeeded = totalCells - nullCells;
      for (let i = 0; i < additionalCellsNeeded; i++) {
        updatedGrid.push(null);
      }
    } else {
      updatedGrid.length = totalCells; // Truncate if somehow longer
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
