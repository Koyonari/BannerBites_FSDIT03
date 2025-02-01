import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-[1000] flex items-center justify-center bg-slate-950 bg-opacity-50">
      <div className="w-full max-w-[500px] rounded-md p-5 shadow-slate-950 light-bg">
        {children}
      </div>
    </div>
  );
};

export default Modal;
