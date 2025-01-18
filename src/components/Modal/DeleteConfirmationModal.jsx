import React from "react";
import ReactDOM from "react-dom";

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-black p-4 shadow-lg light-bg dark:dark-bg">
      <h2 className="mb-3 text-lg text-gray-800 dark:dark-bg dark:secondary-text">
        Delete Layout
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 dark:dark-bg">
        Are you sure you want to delete this layout? This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="primary-bg rounded-lg px-3 py-1 transition-all primary-text hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-500 px-3 py-1 transition-all secondary-text hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmationModal;
