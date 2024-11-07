// src/components/AdViewer/AdViewer.jsx

import React, { useState, useEffect } from "react";

// Component to represent an individual Ad
const AdComponent = ({ type, content, styles }) => {
  let mediaUrl = content.mediaUrl || content.src;

  if (!mediaUrl && content.s3Bucket && content.s3Key) {
    const s3Region = content.s3Region || "ap-southeast-1";
    const encodeS3Key = (key) =>
      key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    const encodedS3Key = encodeS3Key(content.s3Key);
    mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
  }

  return (
    <div className="ad-item" style={styles}>
      {type === "text" && (
        <div>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "image" && (
        <div>
          <img src={mediaUrl} alt={content.title} style={{ maxWidth: "100%" }} />
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "video" && (
        <div>
          <video controls style={{ width: "100%" }}>
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
    </div>
  );
};

// Main AdViewer component to render the layout
const AdViewer = ({ layoutId }) => {
  const [layout, setLayout] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000"); // Adjust as needed

    // Function to handle updates from other tables
    const handleOtherUpdates = (updateType, updatedData) => {
      console.log(`Handling ${updateType} for data:`, updatedData);
      // Re-fetch the entire layout to ensure consistency
      fetch(`/api/layouts/${layoutId}`)
        .then((res) => res.json())
        .then((data) => {
          setLayout(data);
          console.log("Re-fetched layout data after other update");
        })
        .catch((err) => {
          console.error("Error fetching layout after other update:", err);
        });
    };

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      // Request the initial layout data
      socket.send(JSON.stringify({ type: "getLayout", layoutId }));
    };

    socket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log("Received WebSocket message:", response);

        if (response.type === "layoutUpdate" && response.data.layoutId === layoutId) {
          console.log("Received real-time layout update:", response.data);
          setLayout(response.data);
        } else if (response.type === "layoutData" && response.data.layoutId === layoutId) {
          console.log("Received initial layout data:", response.data);
          setLayout(response.data);
        } else if (response.type.endsWith("Update")) {
          console.log(`Received ${response.type}:`, response.data);
          handleOtherUpdates(response.type, response.data);
        } else if (response.type === "error") {
          console.error("WebSocket error message:", response.message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, [layoutId]);

  if (!layout) {
    return <div>Loading layout...</div>;
  }

  const { rows, columns, gridItems } = layout;

  return (
    <div
      className="ad-viewer-grid"
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "10px",
        width: "100%",
        height: "100%",
      }}
    >
      {gridItems.map((item) => {
        if (!item || item.hidden) return null; // Skip null or hidden items

        const { index, row, column, scheduledAds, rowSpan, colSpan } = item;

        // Determine which ad to display based on the current time
        let adToDisplay = null;

        if (scheduledAds && scheduledAds.length > 0) {
          const currentTimeString = `${currentTime
            .getHours()
            .toString()
            .padStart(2, "0")}:${currentTime
            .getMinutes()
            .toString()
            .padStart(2, "0")}`; // Format as "HH:mm"

          // Filter ads that should be displayed now
          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString
          );

          if (availableAds.length > 0) {
            // Get the latest ad scheduled before or at the current time
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime ? currentAd : latestAd
            );
          } else {
            // Get the next upcoming ad
            adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
              currentAd.scheduledTime < nextAd.scheduledTime ? currentAd : nextAd
            );
          }
        }

        if (!adToDisplay) {
          return null; // No ad to display in this cell
        }

        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

        // Compute grid positions
        const gridRowStart = row + 1; // Convert 0-based to 1-based
        const gridColumnStart = column + 1;
        const gridRowEnd = gridRowStart + (rowSpan || 1);
        const gridColumnEnd = gridColumnStart + (colSpan || 1);

        return (
          <div
            key={index}
            className="grid-cell"
            style={{
              gridRow: `${gridRowStart} / ${gridRowEnd}`,
              gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
              border: "1px solid #ccc",
              padding: "10px",
              backgroundColor: "#fafafa",
            }}
          >
            <AdComponent type={type} content={content} styles={styles} />
          </div>
        );
      })}
    </div>
  );
};

export default AdViewer;
