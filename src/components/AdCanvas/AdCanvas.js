import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import './AdCanvas.css';

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
      {type === 'text' && <p>{content}</p>}
      {type === 'image' && <img src={content} alt="Ad" />}
      {type === 'video' && <video src={content} controls style={{ width: '100%' }} />}
      {type === 'clickable' && (
        <button onClick={() => alert('Ad clicked!')}>{content}</button>
      )}
    </div>
  );
};

// Grid Cell component where Ads can be dropped
const GridCell = ({ index, onDrop, item }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'AD_ITEM',
    drop: (draggedItem) => onDrop(draggedItem, index),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [onDrop, index]);

  return (
    <div ref={drop} className={`grid-cell ${isOver ? 'hover' : ''}`}>
      {item ? (
        <AdComponent id={item.id} type={item.type} content={item.content} />
      ) : (
        <p>Drop ad here</p>
      )}
    </div>
  );
};

// Sidebar for draggable ad components
const Sidebar = () => {
  const adOptions = [
    { type: 'text', content: 'Text Ad' },
    { type: 'image', content: 'https://via.placeholder.com/150' },
    { type: 'video', content: 'https://sample-videos.com/video123/mp4/480/asdasdas.mp4' },
    { type: 'clickable', content: 'Click Me' }
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
  const [gridItems, setGridItems] = useState(Array(4).fill(null)); // 2x2 grid = 4 cells

  const handleDrop = (item, index) => {
    const updatedGrid = [...gridItems];
    const newItem = { ...item, id: uuidv4() }; // Generate a unique ID using uuid
    updatedGrid[index] = newItem; // Allow replacing ads
    setGridItems(updatedGrid);
  };

  // Simulate saving grid layout as JSON
  const saveGridAsJson = () => {
    const adLayout = {
      grid: gridItems.map((item, index) => ({
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
              item={item}
            />
          ))}
        </div>

        {/* Save button */}
        <button className="save-button" onClick={saveGridAsJson} disabled={gridItems.includes(null)}>
          Save Layout
        </button>
      </div>
    </div>
  );
};

export default AdCanvas;
