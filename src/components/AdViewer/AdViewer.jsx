<<<<<<< HEAD
import React from "react";
import { useState, useEffect } from "react";

// Component to represent an individual Ad
const AdComponent = ({ type, content, styles }) => {
  // Use the mediaUrl or src directly from the content
=======
import React, { useEffect } from "react";
import WebFont from "webfontloader";
// AdViewer is a component that renders the layout of ads
const AdComponent = ({ type, content = {}, styles = {} }) => {
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
  let mediaUrl = content.mediaUrl || content.src;

  // If mediaUrl is not provided, construct it using s3Bucket and s3Key
  if (!mediaUrl && content.s3Bucket && content.s3Key) {
    // Optionally, include s3Region if needed
    const s3Region = content.s3Region || "ap-southeast-1"; // Replace with your region if different

    // Encode the s3Key properly to handle spaces and special characters
    const encodeS3Key = (key) => {
      return key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    };

    const encodedS3Key = encodeS3Key(content.s3Key);

    mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
  }

  // Load Google Font if fontFamily is specified
  useEffect(() => {
    if (styles.font) {
      WebFont.load({
        google: {
          families: [styles.font],
        },
      });
    }
  }, [styles.font]);

  // AdStyles is an object that contains the styles for the ad
  const adStyles = {
    fontFamily: styles.font,
    fontSize: styles.fontSize,
    color: styles.textColor,
    borderColor: styles.borderColor,
    borderStyle: "solid",
    borderWidth: styles.borderColor ? "2px" : "0px",
    padding: "10px",
    boxSizing: "border-box",
    ...styles,
  };

  return (
    <div className="ad-item" style={adStyles}>
      {type === "Text" && (
        <div>
          <h3 style={{ fontFamily: styles.font, color: styles.textColor }}>
            {content.title}
          </h3>
          <p style={{ fontFamily: styles.font, color: styles.textColor }}>
            {content.description}
          </p>
        </div>
      )}
      {type === "Image" && mediaUrl && (
        <div>
          <img
            src={mediaUrl}
            alt={content.title || "Ad Image"}
            style={{ maxWidth: "100%", borderColor: styles.borderColor }}
          />
        </div>
      )}
      {type === "Video" && mediaUrl && (
        <div>
<<<<<<< HEAD
          <video controls style={{ width: "100%" }}>
=======
          <video
            key={mediaUrl} // Added key prop for real-time communication
            autoPlay
            loop
            muted
            playsInline
            className="w-full"
            style={{ borderColor: styles.borderColor }}
          >
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {/* Handle unsupported types */}
      {type !== "Text" && type !== "Image" && type !== "Video" && (
        <div>Unsupported ad type: {type}</div>
      )}
    </div>
  );
};

// Main AdViewer component to render the layout
const AdViewer = ({ layout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Set up a timer to update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

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

        const { rowSpan, colSpan, scheduledAds, hidden, isMerged } = item;

<<<<<<< HEAD
        // Determine which ad to display based on the current time
=======
        // Skip rendering if the cell is hidden
        if (hidden) {
          return null;
        }

        // Determine if there's an ad to display in this cell
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
        let adToDisplay = null;
        if (scheduledAds && scheduledAds.length > 0) {
<<<<<<< HEAD
          const currentTimeString = `${currentTime
            .getHours()
            .toString()
            .padStart(2, "0")}:${currentTime
            .getMinutes()
            .toString()
            .padStart(2, "0")}`; // Format current time as "HH:mm"
=======
          const currentTimeString = `${new Date()
            .getHours()
            .toString()
            .padStart(2, "0")}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}`; // Format as "HH:mm"
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b

          // Filter ads that should be displayed now
          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString,
          );

          if (availableAds.length > 0) {
            // Get the latest ad scheduled before or at the current time
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime
                ? currentAd
                : latestAd,
            );
          } else {
            // Get the next upcoming ad
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
<<<<<<< HEAD
        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

        // Compute grid positions
        const gridRowStart = row + 1; // Convert 0-based to 1-based index
        const gridColumnStart = column + 1;
        const gridRowEnd = gridRowStart + (rowSpan || 1);
        const gridColumnEnd = gridColumnStart + (colSpan || 1);

=======

        // **Adjustments Start Here**
        // Ensure adToDisplay.ad exists
        if (!adToDisplay || !adToDisplay.ad) {
          return (
            <div
              key={index}
              className="grid-cell"
              style={{
                gridRow: `span ${rowSpan || 1}`,
                gridColumn: `span ${colSpan || 1}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div>No ad scheduled</div>
            </div>
          );
        }

        // Determine the correct ad to display
        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
        return (
          <div
            key={index}
            className="grid-cell"
            style={{
<<<<<<< HEAD
              gridRow: `${gridRowStart} / ${gridRowEnd}`,
              gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
              border: "1px solid #ccc",
              padding: "10px",
              backgroundColor: "#fafafa",
=======
              gridRow: `span ${rowSpan || 1}`,
              gridColumn: `span ${colSpan || 1}`,
              border: styles?.borderColor
                ? `2px solid ${styles.borderColor}`
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
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
