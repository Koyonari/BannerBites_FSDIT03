import React, { useState, useEffect } from "react";
import axios from "axios";

const AssignLayoutToTV = ({ tvId, onLayoutAssigned }) => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/layouts")
      .then((response) => setLayouts(response.data))
      .catch((error) => console.error("Error fetching layouts:", error));
  }, []);

  const handleAssign = () => {
    if (tvId && selectedLayoutId && assignedDate) {
      axios
        .post(`http://localhost:5000/api/tvs/${tvId}/layouts`, {
          layoutId: selectedLayoutId,
          assignedDate: assignedDate,
        })
        .then(() => {
          alert("Layout assigned successfully!");
          onLayoutAssigned();
        })
        .catch((error) =>
          console.error("Error assigning layout to TV:", error),
        );
    } else {
      alert("Please select a layout and date.");
    }
  };

  return (
    <div className="assign-layout">
      <h2>Assign Layout to TV</h2>
      <div>
        <label>Select Layout:</label>
        <select
          value={selectedLayoutId}
          onChange={(e) => setSelectedLayoutId(e.target.value)}
        >
          <option value="">-- Select Layout --</option>
          {layouts.map((layout) => (
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
      <button onClick={handleAssign}>Assign Layout</button>
    </div>
  );
};

export default AssignLayoutToTV;
