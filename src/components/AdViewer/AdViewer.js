import React from 'react';
import './AdViewer.css';

// Placeholder JSON data (default layout example)
const placeholderLayout = {
  rows: 3,
  columns: 3,
  gridItems: [
    {
      id: "b4f5a536-5247-4208-ba56-0ee921f5b803",
      type: "text",
      content: {
        title: "Text Ad",
        description: "This is a text ad."
      },
      rowIndex: 0,
      colIndex: 2,
    },
    {
      id: "79c4b8b8-5664-4e8c-9bfe-da5c17b1e388",
      type: "image",
      content: {
        title: "Image Ad Image Ad Image Ad Image Ad",
        src: "https://via.placeholder.com/150"
      },
      rowIndex: 0,
      colIndex: 0,
      isMerged: true,
      rowSpan: 2,
      colSpan: 2,
      mergeDirection: "selection",
      selectedCells: [
        1,
        4
      ],
      gridArea: "1 / 1 / span 2 / span 2",
    },
    {
      id: "d5c26bbe-0bca-4ce3-85d6-ba7bc61512c2",
      type: "text",
      content: {
        title: "Text Ad",
        description: "This is a text ad."
      },
      rowIndex: 1,
      colIndex: 2,
    },
    {
      id: "8392baf5-6cf4-41d8-9bda-72ebdf7fd88f",
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad."
      },
      rowIndex: 2,
      colIndex: 0,
    },
    {
      id: "c8a467bf-8889-4822-bb34-1481b6fbdf35",
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad."
      },
      rowIndex: 2,
      colIndex: 1,
    },
    {
      id: "baeb1a6b-36b8-4091-9345-273c25e32275",
      type: "text",
      content: {
        title: "Text Ad",
        description: "This is a text ad."
      },
      rowIndex: 2,
      colIndex: 2,
    },
  ],
};
// Placeholder JSON data (default layout example)
const placeholderLayout2 = {
  rows: 2,
  columns: 3,
  gridItems: [
    {
      id: "cd1a39a3-d295-49ef-92f8-a879625ef850",
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad."
      },
      rowIndex: 0,
      colIndex: 0,
    },
    {
      id: "2ee0414a-35f9-451a-9229-7bf5ef802234",
      type: "image",
      content: {
        src: "https://via.placeholder.com/150",
        title: "Image Ad",
        description: "This is an image ad."
      },
      rowIndex: 0,
      colIndex: 1,
    },
    {
      id: "57f38123-1fd3-4ad8-8459-5db39981aac8",
      type: "text",
      content: {
        title: "Text Ad",
        description: "This is a text ad."
      },
      rowIndex: 0,
      colIndex: 2,
    },
    {
      id: "d38076ff-b344-43b4-8587-844786f8de58",
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad."
      },
      rowIndex: 1,
      colIndex: 0,
    },
    {
      id: "fceacced-2912-484d-8487-57e064e90b07",
      type: "image",
      content: {
        src: "https://via.placeholder.com/150",
        title: "Image Ad",
        description: "This is an image ad."
      },
      rowIndex: 1,
      colIndex: 1,
    },
    {
      id: "95195813-2474-2113-a3f7-250d347fdfe2",
      type: "text",
      content: {
        title: "Text Ad",
        description: "This is a text ad."
      },
      rowIndex: 1,
      colIndex: 2,
    },
  ],
};

// Component to represent an individual Ad
const AdComponent = ({ type, content }) => {
  return (
    <div className="ad-item">
      {type === "text" && <p>{content.title}</p>}
      {type === "image" && <img src={content.src} alt={content.title} />}
      {type === "video" && (
        <video src={content.src} controls style={{ width: '100%' }} />
      )}
    </div>
  );
};

// Main AdViewer component to render the layout
const AdViewer = ({ layout = placeholderLayout2 }) => {
  const { rows, columns, gridItems } = layout;

  return (
    <div
      className="ad-viewer-grid"
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '10px',
        width: '100%',
        height: '100%',
      }}
    >
      {gridItems.map((item) => {
        if (!item) return null; // Skip null items

        const { id, type, content, rowIndex, colIndex, rowSpan, colSpan, gridArea } = item;

        return (
          <div
            key={id}
            className="grid-cell"
            style={{
              gridRow: rowSpan ? `span ${rowSpan} / span ${rowSpan}` : rowIndex + 1,
              gridColumn: colSpan ? `span ${colSpan} / span ${colSpan}` : colIndex + 1,
              gridArea: gridArea || undefined,
              border: '1px solid #ccc',
              padding: '10px',
              backgroundColor: '#fafafa',
            }}
          >
            <AdComponent type={type} content={content} />
          </div>
        );
      })}
    </div>
  );
};

export default AdViewer;