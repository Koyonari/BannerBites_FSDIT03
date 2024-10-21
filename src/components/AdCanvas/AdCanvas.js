import React, { useState} from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import './AdCanvas.css';
import EditModal from './EditModal'; // Adjust the path if necessary

// AdComponent for different ad types
const AdComponent = ({ id, type, content }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'AD_ITEM',
    item: { id, type, content },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, type, content]);

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className="ad-item">
      {type === 'text' && <p>{content.title}</p>}
      {type === 'image' && <img src={content.src} alt="Ad" />}
      {type === 'video' && <video src={content.src} controls style={{ width: '100%' }} />}
      {type === 'clickable' && (
        <button onClick={() => alert('Ad clicked!')}>{content.title}</button>
      )}
    </div>
  );
};

// Grid Cell component where Ads can be dropped
const GridCell = ({ index, onDrop, onRemove, onEdit, onMerge, item }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'AD_ITEM',
    drop: (draggedItem) => onDrop(draggedItem, index),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [onDrop, index]);

  const handleMergeHorizontal = () => {
    onMerge(index, 'horizontal');
  };

  const handleMergeVertical = () => {
    onMerge(index, 'vertical');
  };

  const mergedClass = item?.isMerged
    ? item.mergeDirection === 'horizontal'
      ? 'merged-horizontal'
      : 'merged-vertical'
    : '';

  if (item?.hidden) {
    return null; // Don't render anything for hidden cells
  }

  return (
    <div ref={drop} className={`grid-cell ${isOver ? 'hover' : ''} ${mergedClass}`}>
      {item ? (
        <div className="cell-content">
          <AdComponent id={item.id} type={item.type} content={item.content} />
          <div className="actions">
            <button className="edit-button" onClick={() => onEdit(index)}>Edit</button>
            {!item.isMerged && (
              <>
                <button className="merge-button" onClick={handleMergeHorizontal}>Merge Horizontally</button>
                <button className="merge-button" onClick={handleMergeVertical}>Merge Vertically</button>
              </>
            )}
            <button className="remove-button" onClick={() => onRemove(index)}>Remove</button>
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
    { type: 'text', content: { title: 'Text Ad', description: 'This is a text ad.' } },
    { type: 'image', content: { src: 'https://via.placeholder.com/150', title: 'Image Ad', description: 'This is an image ad.' } },
    { type: 'video', content: { src: 'https://sample-videos.com/video123/mp4/480/asdasdas.mp4', title: 'Video Ad', description: 'This is a video ad.' } },
    { type: 'clickable', content: { title: 'Click Me', description: 'This is a clickable ad.' } },
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
  
    // Horizontal merging: merge with the next cell
    if (direction === 'horizontal' && index % 2 === 0 && gridItems[index + 1]) {
      const item1 = gridItems[index];
      const item2 = gridItems[index + 1];
  
      let mergedItem = { ...item1, isMerged: true, span: 2, mergeDirection: 'horizontal' };
      if (item1.type === 'text' && item2.type === 'text') {
        mergedItem.content.title = `${item1.content.title} ${item2.content.title}`;
        mergedItem.content.description = `${item1.content.description || ''} ${item2.content.description || ''}`;
      }
  
      updatedGrid[index] = mergedItem;
      updatedGrid[index + 1] = { isMerged: true, hidden: true }; // Mark next cell as hidden
    }
  
    // Vertical merging: merge with the cell below
    if (direction === 'vertical' && index < 2 && gridItems[index + 2]) {
      const item1 = gridItems[index];
      const item2 = gridItems[index + 2];
  
      let mergedItem = { ...item1, isMerged: true, span: 2, mergeDirection: 'vertical' };
      if (item1.type === 'text' && item2.type === 'text') {
        mergedItem.content.title = `${item1.content.title} ${item2.content.title}`;
      }
  
      updatedGrid[index] = mergedItem;
      updatedGrid[index + 2] = { isMerged: true, hidden: true }; // Mark cell below as hidden
    }
  
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
  const handleRemove = (index) => {
    const updatedGrid = [...gridItems];
    updatedGrid[index] = null; // Set the specific grid cell to null (empty)
    setGridItems(updatedGrid);
  };

  // Opens the edit modal for the selected ad
  const handleEdit = (index) => {
    setCurrentAd({ ...gridItems[index], index });
    setIsEditing(true);
  };

  // Saves the updated ad content to the grid
  const handleSave = (updatedContent) => {
    const updatedGrid = [...gridItems];
    updatedGrid[currentAd.index].content = updatedContent;
    setGridItems(updatedGrid);
    setIsEditing(false);
  };

  // Simulate saving grid layout as JSON
  const saveGridAsJson = () => {
    const adLayout = {
      grid: gridItems
        .filter((item) => !item?.hidden)
        .map((item, index) => ({
          cell: index + 1,
          adType: item ? item.type : null,
          content: item ? item.content : null,
        })),
    };

    console.log('Saved Layout:', JSON.stringify(adLayout, null, 2));
    alert(`Layout saved:\n${JSON.stringify(adLayout, null, 2)}`);
  };

  return (
    <div className="canvas-wrapper">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main canvas on the right */}
      <div className="canvas">
        <div className="banner">
          <h2>Advertisement Banner</h2>
        </div>

        {/* 2x2 Grid for ad components */}
        <div className="grid">
          {gridItems.map((item, index) => (
            <GridCell
              key={index}
              index={index}
              onDrop={handleDrop}
              onRemove={handleRemove}
              onEdit={handleEdit}
              onMerge={handleMerge}
              item={item}
            />
          ))}
        </div>

        {/* Save button */}
        <button
          className="save-button"
          onClick={saveGridAsJson}
          disabled={gridItems.includes(null)}
        >
          Save Layout
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && currentAd && (
        <EditModal
          ad={currentAd}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

export default AdCanvas;
