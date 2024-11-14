import React from "react";
import ReactDOM from "react-dom";

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Centralized Modal Style
  const modalStyle = {
    position: "fixed",
    top: '50%',
    left: '50%',
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  };

  return ReactDOM.createPortal(
    <div style={modalStyle} className="bg-white rounded-lg p-4 shadow-md dark:bg-gray-800">
      <h2 className="text-lg mb-3 text-gray-800 dark:text-white">Delete Layout</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        Are you sure you want to delete this layout? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-300 text-black rounded-lg px-3 py-1 hover:bg-gray-400 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 text-white rounded-lg px-3 py-1 hover:bg-red-600 transition-all"
        >
          Delete
        </button>
      </div>
    </div>,
    document.body // This ensures the modal is rendered at the root level of the DOM
  );
};

export default DeleteConfirmationModal;
