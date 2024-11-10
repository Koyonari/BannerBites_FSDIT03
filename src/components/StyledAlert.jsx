import React from "react";
import { X } from "lucide-react";

const StyledAlert = ({ isOpen, onClose, title, message, type = "info" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div
        className={`animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-sm rounded-lg border-l-4 border-orange-500 bg-white p-4 shadow-lg duration-300 dark:bg-black dark:text-white`}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center pt-2 text-center">
          <h3 className="mb-1 text-2xl font-semibold">{title}</h3>
          <p className="text-lg opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default StyledAlert;
