// src/components/AdViewer/AdViewer.jsx
import React from "react";

// Component to represent an individual Ad
const AdComponent = ({ type, content, styles }) => {
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

  return (
    <div
      className="ad-item"
      style={{
        ...styles,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {type === "text" && (
        <div style={{ textAlign: "center" }}>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "image" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={mediaUrl}
            alt={content.title}
            style={{
              objectFit: "contain",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          />
        </div>
      )}
      {type === "video" && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
      {gridItems.map((item, index) => {
        // Ensure that each cell occupies its space
        const { scheduledAds, rowSpan, colSpan, isMerged, hidden } = item;

        // Empty cells or hidden cells should still occupy space
        if (!scheduledAds || scheduledAds.length === 0) {
          return (
            <div
              key={index}
              className="grid-cell"
              style={{
                gridRow: `span ${rowSpan || 1}`,
                gridColumn: `span ${colSpan || 1}`,
                border: "1px dashed #ccc",
              }}
            />
          );
        }

        if (hidden) {
          return (
            <div
              key={index}
              className="grid-cell"
              style={{
                gridRow: `span ${rowSpan || 1}`,
                gridColumn: `span ${colSpan || 1}`,
                border: "1px dashed #ccc",
                visibility: "hidden",
              }}
            />
          );
        }

        // Determine which ad to display
        let adToDisplay = null;

        if (scheduledAds && scheduledAds.length > 0) {
          const currentTimeString = `${new Date()
            .getHours()
            .toString()
            .padStart(2, "0")}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}`; // Format as "HH:mm"

          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString
          );

          if (availableAds.length > 0) {
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime
                ? currentAd
                : latestAd
            );
          } else {
            adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
              currentAd.scheduledTime < nextAd.scheduledTime
                ? currentAd
                : nextAd
            );
          }
        }

        if (!adToDisplay) {
          return (
            <div
              key={index}
              className="grid-cell"
              style={{
                gridRow: `span ${rowSpan || 1}`,
                gridColumn: `span ${colSpan || 1}`,
                border: "1px dashed #ccc",
              }}
            />
          );
        }

        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

        // Ensure the content of merged cells is centered
        return (
          <div
            key={index}
            className="grid-cell"
            style={{
              gridRow: `span ${rowSpan || 1}`,
              gridColumn: `span ${colSpan || 1}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              border: "1px solid #ddd", // Adding border for better visibility of the cells
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
