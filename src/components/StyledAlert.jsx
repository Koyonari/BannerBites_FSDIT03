import React from "react";
import { X } from "lucide-react";

const StyledAlert = ({ isOpen, onClose, title, message, type = "info" }) => {
  if (!isOpen) return null;

  return (
    <div className="dark-bg/50 fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className={`animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-sm rounded-lg border-l-4 p-4 shadow-lg duration-300 primary-border light-bg dark:dark-bg dark:secondary-text`}
      >
        <button
          onClick={onClose}
          className="hover:neutral-bg dark:hover:neutralalt-bg absolute right-2 top-2 rounded-full p-1"
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
