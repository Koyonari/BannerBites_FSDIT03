// SaveLayoutModal.js
import React, { useState } from "react";
import Modal from "../Modal/Modal"; // Adjust the import path based on your project structure

// SaveLayoutModal is a modal popup that allows the user to save the current layout
const SaveLayoutModal = ({ onSave, onClose }) => {
  const [layoutName, setLayoutName] = useState("");
<<<<<<< HEAD

=======
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  // showAlert is a function that displays an alert message
  const showAlert = (message, title = "Alert", type = "info") => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };
  // handleSave is a function that saves the current layout
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
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
        className="mt-3 rounded-md border text-sm secondary-border"
        type="text"
        value={layoutName}
        onChange={(e) => setLayoutName(e.target.value)}
        placeholder="Enter layout name"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <div style={{ textAlign: "right" }} className="text-xs lg:text-sm">
        <button
          className="primary-bg rounded-md p-1 px-2.5 secondary-text"
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
