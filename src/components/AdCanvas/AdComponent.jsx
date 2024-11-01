import React from "react";
import { useDrag } from "react-dnd";

const AdComponent = ({ id, type }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "AD_ITEM",
      item: { id, type },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, type]
  );

  return (
    <div
      ref={drag}
      className={`
        hover:scale-105 transition-transform duration-200 ease-in-out cursor-move p-2
        bg-transparent !shadow-none !border-none !outline-none font-bold
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
    >
      {type}
    </div>
  );
};

export default AdComponent;
