import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-slate-950 bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white p-5 rounded-md shadow-slate-950 max-w-[500px] w-full">
        <button
          className="bg-transparent border-none cursor-pointer text-[20px] absolute top-2.5 right-2.5"
          onClick={onClose}
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
