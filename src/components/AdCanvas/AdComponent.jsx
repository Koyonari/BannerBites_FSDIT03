import React from "react";
import { useDrag } from "react-dnd";

// AdComponent is a draggable component that can be dragged and dropped into the AdCanvas
const AdComponent = ({ id, type }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "AD_ITEM",
      item: { id, type },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, type],
  );

  return (
    <div
      ref={drag}
      className={`cursor-move !border-none bg-transparent p-2 font-bold !shadow-none !outline-none transition-transform duration-200 ease-in-out hover:scale-105 ${isDragging ? "opacity-50" : "opacity-100"} `}
    >
      {type}
    </div>
  );
};

export default AdComponent;
