// SaveLayoutModal.js
import React, { useState } from "react";
import Modal from "../Modal/Modal"; // Adjust the import path based on your project structure

const SaveLayoutModal = ({ onSave, onClose }) => {
  const [layoutName, setLayoutName] = useState("");

  const handleSave = () => {
    if (layoutName.trim() === "") {
      alert("Please enter a name for the layout.");
      return;
    }
    onSave(layoutName);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h2 className="text-xl">
        <b>Save Layout</b>
      </h2>
      <input
        className="border border-gray-300 rounded-md mt-3 text-sm"
        type="text"
        value={layoutName}
        onChange={(e) => setLayoutName(e.target.value)}
        placeholder="Enter layout name"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <div style={{ textAlign: "right" }} className="text-xs lg:text-sm">
        <button
          className="bg-orange-500 p-1 text-white rounded-md px-2.5"
          onClick={handleSave}
          style={{ marginRight: "10px" }}
        >
          <b>Save</b>
        </button>
        <button onClick={onClose} className="ml-1">
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default SaveLayoutModal;
