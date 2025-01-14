// Selection mode popup component, which is displayed when the user is in selection mode
const SelectionModePopup = ({ isVisible }) => {
  return (
    <div
<<<<<<< HEAD
      className={`fixed right-0 top-[80vh] z-[1000] -translate-y-1/2 transform rounded-l-2xl border-2 border-e-0 border-orange-500 bg-white p-4 text-black shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
=======
      className={`fixed right-0 top-[80vh] z-[1000] -translate-y-1/2 transform rounded-l-2xl border-2 border-e-0 p-4 shadow-lg transition-transform duration-300 ease-in-out primary-border light-bg primary-text xl:border-4 xl:border-e-0 ${isVisible ? "translate-x-0" : "translate-x-full"}`}
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
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
