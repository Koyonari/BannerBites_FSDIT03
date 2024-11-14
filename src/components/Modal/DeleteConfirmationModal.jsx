import React from "react";
import ReactDOM from "react-dom";

const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-black bg-white p-4 shadow-lg dark:bg-black">
      <h2 className="mb-3 text-lg text-gray-800 dark:bg-black dark:text-white">
        Delete Layout
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:bg-black dark:text-gray-300">
        Are you sure you want to delete this layout? This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg bg-gray-300 px-3 py-1 text-black transition-all hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-red-500 px-3 py-1 text-white transition-all hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteConfirmationModal;
