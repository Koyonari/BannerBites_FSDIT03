import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import './AdCanvas.css'; 
// Have to implement dynamoDB to save the layout in the future, currently testing using JSON

// AdComponent for different ad types
const AdComponent = ({ type, content }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'AD_ITEM',
    item: { type, content },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {type === 'text' && <p>{content}</p>}
      {type === 'image' && <img src={content} alt="Ad" />}
      {type === 'video' && <video src={content} controls />}
      {type === 'clickable' && (
        <button onClick={() => alert('Ad clicked!')}>{content}</button>
      )}
    </div>
  );
};

// Grid Cell component where Ads can be dropped
const GridCell = ({ accept, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'AD_ITEM',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={`grid-cell ${isOver ? 'hover' : ''}`}>
      {children}
    </div>
  );
};

// The main Canvas component
const AdCanvas = () => {
  const [gridItems, setGridItems] = useState(Array(4).fill(null)); // 2x2 grid = 4 cells

  const handleDrop = (item, index) => {
    const updatedGrid = [...gridItems];
    updatedGrid[index] = item;
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

    // Log the JSON data to the console
    console.log('Saved Layout:', JSON.stringify(adLayout, null, 2));

    // Show an alert with the JSON data for quick feedback
    alert(`Layout saved:\n${JSON.stringify(adLayout, null, 2)}`);
  };

  return (
    <div className="canvas">
      {/* Banner at the top */}
      <div className="banner">
        <h2>Advertisement Banner</h2>
      </div>

      {/* 2x2 Grid for ad components */}
      <div className="grid">
        {gridItems.map((item, index) => (
          <GridCell
            key={index}
            accept="AD_ITEM"
            onDrop={(item) => handleDrop(item, index)}
          >
            {item ? <AdComponent type={item.type} content={item.content} /> : <p>Drop ad here</p>}
          </GridCell>
        ))}
      </div>

      {/* Save button */}
      <button className="save-button" onClick={saveGridAsJson}>
        Save Layout
      </button>
    </div>
  );
};

export default AdCanvas;
