// AdComponent.js
import React from "react";
import { useDrag } from "react-dnd";

const AdComponent = ({ id, type, content, styles }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "AD_ITEM",
      item: { id, type, content, styles },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, type, content, styles]
  );

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        borderColor: styles?.borderColor || "black",
        borderStyle: "solid",
        borderWidth: "1px",
      }}
      className="ad-item"
    >
      {type === "text" && (
        <p
          style={{
            fontFamily: styles?.font || "Arial",
            fontSize: styles?.fontSize || "14px",
            color: styles?.textColor || "black",
          }}
        >
          {content.title}
        </p>
      )}
      {type === "image" && (
        <img
          src={content.src}
          alt="Ad"
          style={{
            borderColor: styles?.borderColor || "black",
            borderStyle: "solid",
            borderWidth: "1px",
          }}
        />
      )}
      {type === "video" && (
        <video
          src={content.src}
          controls
          style={{
            width: "100%",
            borderColor: styles?.borderColor || "black",
            borderStyle: "solid",
            borderWidth: "1px",
          }}
        />
      )}
      {type === "clickable" && (
        <button
          onClick={() => alert("Ad clicked!")}
          style={{
            fontFamily: styles?.font || "Arial",
            fontSize: styles?.fontSize || "14px",
            color: styles?.textColor || "black",
          }}
        >
          {content.title}
        </button>
      )}
    </div>
  );
};

export default AdComponent;
