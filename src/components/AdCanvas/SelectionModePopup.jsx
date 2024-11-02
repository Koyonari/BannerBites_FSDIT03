const SelectionModePopup = ({ isVisible }) => {
  return (
    <div
      className={`fixed z-[1000] bg-white right-0 top-[80vh] transform border-orange-500 border-e-0 border-2 
          -translate-y-1/2 text-black p-4 rounded-l-2xl shadow-lg transition-transform duration-300 ease-in-out
          ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      style={{
        transform: `translate(${isVisible ? "0" : "100%"}, -50%)`,
      }}
    >
      <span className="text-xs">
        You're in <b>selection mode</b>
      </span>
    </div>
  );
};

export default SelectionModePopup;
