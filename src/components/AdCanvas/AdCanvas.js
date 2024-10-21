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
const GridCell = ({ index, onDrop, onRemove, onEdit, onMerge, item }) => {
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

  const handleMergeHorizontal = () => {
    onMerge(index, "horizontal");
  };

  const handleMergeVertical = () => {
    onMerge(index, "vertical");
  };

  const mergedClass = item?.isMerged
    ? item.mergeDirection === "horizontal"
      ? "merged-horizontal"
      : "merged-vertical"
    : "";

  if (item?.hidden) {
    return null; // Don't render anything for hidden cells
  }

  return (
    <div
      ref={drop}
      className={`grid-cell ${isOver ? "hover" : ""} ${mergedClass}`}
    >
      {item ? (
        <div className="cell-content">
          <AdComponent id={item.id} type={item.type} content={item.content} />
          <div className="actions">
            <button className="edit-button" onClick={() => onEdit(index)}>
              Edit
            </button>
            {!item.isMerged && (
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
            <button className="remove-button" onClick={() => onRemove(index)}>
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
const AdCanvas = () => {
  const [gridItems, setGridItems] = useState(Array(4).fill(null)); // Initial 2x2 grid = 4 cells
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);

  // Handles merging two adjacent cells
  const handleMerge = (index, direction) => {
    const updatedGrid = [...gridItems];

    // Error handling for merging
    if (updatedGrid[index]?.isMerged) {
      alert("Cannot merge a merged cell!");
      return;
    }

    // Check if merging all four images
    const canMergeAll = (grid) => {
      return (
        grid[index] &&
        grid[index + 1] &&
        grid[index + 2] &&
        grid[index + 3] &&
        grid[index].type === grid[index + 1].type &&
        grid[index].type === grid[index + 2].type &&
        grid[index].type === grid[index + 3].type
      );
    };

    // Handle merging all four cells
    if (canMergeAll(updatedGrid)) {
      const mergedItem = {
        ...updatedGrid[index],
        isMerged: true,
        span: 4, // To indicate it covers four cells
        mergeDirection: "all",
        content: {
          title: updatedGrid[index].content.title, // Use the first ad's content as the base
        },
      };

      updatedGrid[index] = mergedItem;
      updatedGrid[index + 1] = { isMerged: true, hidden: true }; // Hide the next three cells
      updatedGrid[index + 2] = { isMerged: true, hidden: true };
      updatedGrid[index + 3] = { isMerged: true, hidden: true };
    } else {
      // Horizontal merging
      if (
        direction === "horizontal" &&
        index % 2 === 0 &&
        updatedGrid[index + 1]
      ) {
        const item1 = updatedGrid[index];
        const item2 = updatedGrid[index + 1];

        let mergedItem = {
          ...item1,
          isMerged: true,
          span: 2,
          mergeDirection: "horizontal",
        };
        if (item1.type === "text" && item2.type === "text") {
          mergedItem.content.title = `${item1.content.title} ${item2.content.title}`;
          mergedItem.content.description = `${
            item1.content.description || ""
          } ${item2.content.description || ""}`;
        }

        updatedGrid[index] = mergedItem;
        updatedGrid[index + 1] = { isMerged: true, hidden: true }; // Hide the next cell
      }

      // Vertical merging
      if (direction === "vertical" && index < 2 && updatedGrid[index + 2]) {
        const item1 = updatedGrid[index];
        const item2 = updatedGrid[index + 2];

        let mergedItem = {
          ...item1,
          isMerged: true,
          span: 2,
          mergeDirection: "vertical",
        };
        if (item1.type === "text" && item2.type === "text") {
          mergedItem.content.title = `${item1.content.title} ${item2.content.title}`;
        }

        updatedGrid[index] = mergedItem;
        updatedGrid[index + 2] = { isMerged: true, hidden: true }; // Hide the cell below
      }
    }

    setGridItems(updatedGrid);
  };

  // Merges all four cells if they are the same type
  const mergeAllCells = () => {
    const updatedGrid = [...gridItems];

    // Error handling for merging
    if (
      !updatedGrid.every(
        (item) => item !== null && item.type === updatedGrid[0].type
      )
    ) {
      alert("All cells must be of the same type to merge!");
      return;
    }

    const mergedItem = {
      ...updatedGrid[0],
      isMerged: true,
      span: 4,
      mergeDirection: "all",
      content: {
        title: updatedGrid[0].content.title,
      },
    };

    updatedGrid[0] = mergedItem;
    updatedGrid[1] = { isMerged: true, hidden: true };
    updatedGrid[2] = { isMerged: true, hidden: true };
    updatedGrid[3] = { isMerged: true, hidden: true };

    setGridItems(updatedGrid);
  };

  // Handles dropping an ad into a specific grid cell
  const handleDrop = (item, index) => {
    const updatedGrid = [...gridItems];
    const newItem = { ...item, id: uuidv4() }; // Generate a unique ID using uuid
    updatedGrid[index] = newItem; // Allow overriding of ads
    setGridItems(updatedGrid);
  };

  // Removes the ad from the specified index (grid cell)
  // Removes the ad from the specified index (grid cell)
  const handleRemove = (index) => {
    const updatedGrid = [...gridItems];

    // If the item is merged, revert to original state
    if (updatedGrid[index]?.isMerged) {
      const mergeDirection = updatedGrid[index].mergeDirection;

      if (mergeDirection === "horizontal") {
        updatedGrid[index] = null; // Remove the merged cell
        const nextIndex = index + 1;
        updatedGrid[nextIndex] = null; // Reset the next cell to empty
      } else if (mergeDirection === "vertical") {
        updatedGrid[index] = null; // Remove the merged cell
        const nextIndex = index + 2;
        updatedGrid[nextIndex] = null; // Reset the cell below to empty
      } else {
        // For 'all' direction, reset all merged cells
        updatedGrid[index] = null; // Remove the merged cell
        updatedGrid[index + 1] = null; // Reset the next cell to empty
        updatedGrid[index + 2] = null; // Reset the cell below to empty
        updatedGrid[index + 3] = null; // Reset the last cell to empty
      }
    } else {
      updatedGrid[index] = null; // Remove the cell ad
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
      <div className="grid">
        {gridItems.map((item, index) => (
          <GridCell
            key={index}
            index={index}
            item={item}
            onDrop={handleDrop}
            onRemove={handleRemove}
            onEdit={handleEdit}
            onMerge={handleMerge}
          />
        ))}
      </div>
      <button onClick={mergeAllCells}>Merge All</button>
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
