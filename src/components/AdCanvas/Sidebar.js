// Sidebar.js
import React from "react";
import AdComponent from "./AdComponent";

const Sidebar = () => {
  const adOptions = [
    {
      type: "text",
      content: { title: "Text Ad", description: "This is a text ad." },
    },
    {
      type: "image",
      content: {
        src: "https://via.placeholder.com/150",
        title: "Image Ad",
        description: "This is an image ad.",
      },
    },
    {
      type: "video",
      content: {
        src: "https://sample-videos.com/video123/mp4/480/asdasdas.mp4",
        title: "Video Ad",
        description: "This is a video ad.",
      },
    },
    {
      type: "clickable",
      content: { title: "Click Me", description: "This is a clickable ad." },
    },
  ];

  return (
    <div className="sidebar">
      <h3>Ad Options</h3>
      {adOptions.map((ad, index) => (
        <AdComponent
          key={index}
          id={`sidebar-${ad.type}-${index}`}
          type={ad.type}
          content={ad.content}
        />
      ))}
    </div>
  );
};

export default Sidebar;
