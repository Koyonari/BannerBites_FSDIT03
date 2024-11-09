// src/components/AdViewer/AdViewer.jsx

import React from "react";

// Component to represent an individual Ad
const AdComponent = ({ id, type, content, styles }) => {
  let mediaUrl = content.mediaUrl || content.src;

  if (!mediaUrl && content.s3Bucket && content.s3Key) {
    const s3Region = content.s3Region || "ap-southeast-1";
    const encodeS3Key = (key) =>
      key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    const encodedS3Key = encodeS3Key(content.s3Key);
    mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
  }

  return (
    <div className="ad-item" data-ad-id={id} style={styles}>
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
const AdViewer = ({ layout }) => {
  if (!layout) {
    return <div>No layout provided</div>;
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

        let adToDisplay = null;

        if (scheduledAds && scheduledAds.length > 0) {
          const currentTime = new Date();
          const currentTimeString = `${currentTime.getHours()
            .toString()
            .padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`; // Format as "HH:mm"

          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString
          );

          if (availableAds.length > 0) {
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime ? currentAd : latestAd
            );
          } else {
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
            <AdComponent
              id={index} // Assign unique id based on index
              type={type}
              content={content}
              styles={styles}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AdViewer;