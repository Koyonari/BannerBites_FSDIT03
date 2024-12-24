// SaveLayoutModal.js
import React, { useState } from "react";
import Modal from "../Modal/Modal";
import StyledAlert from "../StyledAlert";

// SaveLayoutModal is a modal popup that allows the user to save the current layout
const SaveLayoutModal = ({ onSave, onClose }) => {
  const [layoutName, setLayoutName] = useState("");
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
  const handleSave = () => {
    if (layoutName.trim() === "") {
      showAlert("Please enter a name for the layout.");
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
          className="rounded-md p-1 px-2.5 pcolor-bg secondary-text"
          onClick={handleSave}
          style={{ marginRight: "10px" }}
        >
          <b>Save</b>
        </button>
        <button onClick={onClose} className="ml-1">
          Cancel
        </button>
      </div>
      <StyledAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </Modal>
  );
};

export default SaveLayoutModal;
