import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignLayoutTab = ({ locationId, tvId }) => {
  // State variables for handling layouts, selected layout, and assignment date
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [assignStatus, setAssignStatus] = useState(null);

  // Fetch layouts from the server
  useEffect(() => {
    axios.get('http://localhost:5000/api/layouts')
      .then(response => setLayouts(response.data))
      .catch(error => console.error('Error fetching layouts:', error));
  }, []);

  // Function to handle the assignment of a layout to a TV
  const handleAssignLayout = () => {
    if (selectedLayoutId && tvId && assignedDate) {
      axios.post(`http://localhost:5000/api/tvs/${tvId}/layouts`, {
        layoutId: selectedLayoutId,
        assignedDate,
      })
      .then(() => {
        setAssignStatus('Layout assigned successfully!');
        // Optionally reset selection after assigning
        setSelectedLayoutId('');
        setAssignedDate('');
      })
      .catch(error => {
        setAssignStatus('Error assigning layout');
        console.error('Error assigning layout to TV:', error);
      });
    } else {
      setAssignStatus('Please select all options to assign a layout');
    }
  };

  return (
    <div className="assign-layout-tab">
      <h2>Assign Layout to TV</h2>
      
      <div>
        <label>Available Layouts:</label>
        <select
          value={selectedLayoutId}
          onChange={(e) => setSelectedLayoutId(e.target.value)}
        >
          <option value="">Select Layout</option>
          {layouts.map(layout => (
            <option key={layout.layoutId} value={layout.layoutId}>
              {layout.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Assign Date:</label>
        <input
          type="datetime-local"
          value={assignedDate}
          onChange={(e) => setAssignedDate(e.target.value)}
        />
      </div>

      <button onClick={handleAssignLayout}>Assign Layout</button>

      {assignStatus && <p>{assignStatus}</p>}
    </div>
  );
};

export default AssignLayoutTab;
