import React, { useEffect, useState } from "react";
import AdViewer from "./AdViewer";

const LayoutViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/layouts/${layoutId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch layout");
        }
        const data = await response.json();
        setLayout(data);
      } catch (error) {
        console.error("Error fetching layout:", error);
      }
    };

    if (layoutId) {
      fetchLayout();
    }
  }, [layoutId]);

<<<<<<< HEAD
=======
// LayoutViewer is a component that renders the layout of ads, wraps AdViewer component
const LayoutViewer = ({ layout }) => {
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  if (!layout) {
    return <div>Loading layout...</div>;
  }

  return (
    <div>
      <h2>Layout Viewer</h2>
      <AdViewer layout={layout} />
    </div>
  );
};

export default LayoutViewer;
