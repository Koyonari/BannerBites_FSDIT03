// src/components/AdViewer/AdViewer.jsx
import React from "react";

// Component to represent an individual Ad
const AdComponent = ({ type = "unknown", content = {}, styles = {} }) => {
  let mediaUrl = content.mediaUrl || content.src;

  if (!mediaUrl && content.s3Bucket && content.s3Key) {
    const s3Region = content.s3Region || "ap-southeast-1";
    const encodeS3Key = (key) =>
      key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    const encodedS3Key = encodeS3Key(content.s3Key);
    mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
  }

  // Handle unknown ad types
  if (type === "unknown") {
    return (
      <div className="ad-item" style={styles}>
        <p className="text-red-500">Unknown ad type</p>
      </div>
    );
  }

  // Handle missing content gracefully
  if (type === "text" && !content.title && !content.description) {
    return (
      <div className="ad-item" style={styles}>
        <p className="text-gray-500">No content available for text ad</p>
      </div>
    );
  }

  if (type === "image" && !mediaUrl) {
    return (
      <div className="ad-item" style={styles}>
        <p className="text-gray-500">Image source not available</p>
      </div>
    );
  }

  if (type === "video" && !mediaUrl) {
    return (
      <div className="ad-item" style={styles}>
        <p className="text-gray-500">Video source not available</p>
      </div>
    );
  }

  return (
    <div className="ad-item" style={styles}>
      {type === "text" && (
        <div>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "image" && mediaUrl && (
        <div>
          <img
            src={mediaUrl}
            alt={content.title || "Image Ad"}
            style={{ maxWidth: "100%" }}
          />
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "video" && mediaUrl && (
        <div>
          <video autoPlay loop muted playsInline className="w-full">
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
          const currentTimeString = `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`; // Format as "HH:mm"

          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString,
          );

          if (availableAds.length > 0) {
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime
                ? currentAd
                : latestAd,
            );
          } else {
            adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
              currentAd.scheduledTime < nextAd.scheduledTime
                ? currentAd
                : nextAd,
            );
          }
        }

        if (!adToDisplay || !adToDisplay.ad) {
          return (
            <div
              key={index}
              className="grid-cell"
              style={{
                gridRow: `${row + 1} / ${row + 1 + (rowSpan || 1)}`,
                gridColumn: `${column + 1} / ${column + 1 + (colSpan || 1)}`,
              }}
            ></div>
          );
        }

        const { type, content, styles } = adToDisplay.ad;

        return (
          <div
            key={index}
            className="grid-cell"
            style={{
              gridRow: `${row + 1} / ${row + 1 + (rowSpan || 1)}`,
              gridColumn: `${column + 1} / ${column + 1 + (colSpan || 1)}`,
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
