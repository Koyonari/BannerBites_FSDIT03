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
    <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-center text-4xl font-semibold text-gray-800">
        Assign Layout
      </h2>

      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Select Layout:
          </label>
          <select
            value={selectedLayoutId}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">-- Select Layout --</option>
            {layouts.map((layout) => (
              <option key={layout.layoutId} value={layout.layoutId}>
                {layout.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Assign Date:
          </label>
          <input
            type="datetime-local"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={handleAssign}
          className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Assign Layout
        </button>
      </div>
    </div>
  );
};

export default AssignLayoutToTV;
