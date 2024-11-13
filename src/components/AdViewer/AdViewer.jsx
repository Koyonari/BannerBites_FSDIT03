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
    <div className="ad-item" style={styles}>
      {type === "text" && (
        <div>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "image" && (
        <div>
          <img
            src={mediaUrl}
            alt={content.title}
            style={{ maxWidth: "100%" }}
          />
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === "video" && (
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
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {gridItems.map((item, index) => {
        if (!item) return null;

        const {
          rowSpan,
          colSpan,
          scheduledAds,
          hidden,
          isMerged,
          selectedCells,
        } = item;

        // Skip rendering if the cell is hidden
        if (hidden) {
          return null;
        }

        // Determine if there's an ad to display in this cell
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

        // If no ad is available and the cell is not merged, render an empty cell
        if (!adToDisplay && !isMerged) {
          return (
            <div
              key={index}
              style={{
                gridRow: `span ${rowSpan || 1}`,
                gridColumn: `span ${colSpan || 1}`,
              }}
            />
          );
        }

        // Determine the correct ad to display
        const ad = adToDisplay ? adToDisplay.ad : null;
        const { type, content, styles } = ad || {};

        return (
          <div
            key={index}
            className="grid-cell"
            style={{
              gridRow: `span ${rowSpan || 1}`,
              gridColumn: `span ${colSpan || 1}`,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {adToDisplay && (
              <AdComponent type={type} content={content} styles={styles} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AdViewer;
