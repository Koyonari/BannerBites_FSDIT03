import React, { useEffect, useState } from 'react';

const LayoutSelector = ({ onSelect, onClose }) => {
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    // Fetch the list of layouts from the backend
    const fetchLayouts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/layouts');
        if (!response.ok) {
          throw new Error('Failed to fetch layouts');
        }
        const data = await response.json();

        // Filter unique layouts to remove duplicates
        const uniqueLayouts = data.filter((layout, index, self) =>
          index === self.findIndex((l) => l.layoutId === layout.layoutId)
        );

        setLayouts(uniqueLayouts);
      } catch (error) {
        console.error('Error fetching layouts:', error);
      }
    };

    fetchLayouts();
  }, []);

  return (
    <div className="modal">
      <h2>Select a Layout</h2>
      <ul>
        {layouts.map((layout) => (
          <li key={layout.layoutId}>
            <button onClick={() => onSelect(layout.layoutId)}>
              {layout.name || 'Unnamed Layout'}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default LayoutSelector;
