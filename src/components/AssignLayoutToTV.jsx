import React, { useState, useEffect } from "react";
import axios from "axios";
import StyledAlert from "./StyledAlert";

const AssignLayoutToTV = ({ tvId, onLayoutAssigned }) => {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

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
          showAlert("Layout assigned successfully!");
          onLayoutAssigned();
        })
        .catch((error) =>
          console.error("Error assigning layout to TV:", error),
        );
    } else {
      showAlert("Please select a layout and date.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-center text-5xl font-semibold text-gray-800 xl:text-5xl">
        Assign Layout
      </h2>

      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700 lg:text-lg">
            Select Layout:
          </label>
          <select
            value={selectedLayoutId}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 lg:text-lg"
          >
            <option value="">Select Layout</option>
            {layouts.map((layout) => (
              <option key={layout.layoutId} value={layout.layoutId}>
                {layout.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700 lg:text-lg">
            Assign Date:
          </label>
          <input
            type="datetime-local"
            value={assignedDate}
            onChange={(e) => setAssignedDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 lg:text-lg"
          />
        </div>

        <button
          onClick={handleAssign}
          className="mt-4 w-full rounded-md bg-orange-600 px-4 py-2 font-bold text-white transition-colors duration-200 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 lg:text-lg"
        >
          Assign Layout
        </button>
      </div>
      <StyledAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
};

export default AssignLayoutToTV;
