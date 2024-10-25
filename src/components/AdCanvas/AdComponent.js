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
        ad-item cursor-move p-2 border-none
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
    >
      {type}
    </div>
  );
};

export default AdComponent;
