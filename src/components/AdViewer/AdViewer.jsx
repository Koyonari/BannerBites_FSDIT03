import React, { useEffect } from "react";
import WebFont from "webfontloader";

// A separate component that handles a single ad’s rendering:
const AdComponent = ({ type, content = {}, styles = {} }) => {
  let mediaUrl = content.mediaUrl || content.src;

  // If your content uses S3 keys, build the URL
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

  // Load Google Font if specified
  useEffect(() => {
    if (styles.font) {
      WebFont.load({
        google: {
          families: [styles.font],
        },
      });
    }
  }, [styles.font]);

  // Ad-level styles
  const adStyles = {
    fontFamily: styles.font,
    fontSize: styles.fontSize,
    color: styles.textColor,
    borderColor: styles.borderColor,
    borderStyle: "solid",
    borderWidth: styles.borderColor ? "2px" : "0px",
    padding: "10px",
    boxSizing: "border-box",
    // ...anything else from styles you might want to directly apply
    ...styles,
  };

  // Render based on ad type
  return (
    <div style={adStyles}>
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
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
      )}

      {type === "Video" && mediaUrl && (
        <div>
          <video
            key={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "100%" }}
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {type !== "Text" && type !== "Image" && type !== "Video" && (
        <div>Unsupported ad type: {type}</div>
      )}
    </div>
  );
};

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

        const { rowSpan, colSpan, scheduledAds, hidden, isMerged } = item;

        // Skip rendering if the cell is hidden
        if (hidden) {
          return null;
        }

        // Pick an ad by time logic:
        let adToDisplay = null;
        if (scheduledAds && scheduledAds.length > 0) {
          const currentTimeString = `${new Date()
            .getHours()
            .toString()
            .padStart(2, "0")}:${new Date()
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          const availableAds = scheduledAds.filter(
            (scheduledAd) => scheduledAd.scheduledTime <= currentTimeString
          );

          if (availableAds.length > 0) {
            // Use the latest scheduledTime that is <= currentTime
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              currentAd.scheduledTime > latestAd.scheduledTime
                ? currentAd
                : latestAd
            );
          } else {
            // Or if no ads are started yet, show the earliest upcoming ad
            adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
              currentAd.scheduledTime < nextAd.scheduledTime
                ? currentAd
                : nextAd
            );
          }
        }

        // If no ad and not merged, render empty cell
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

        // If no ad data, show placeholder
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
                backgroundColor: "#fff",
              }}
            >
              <div>No ad scheduled</div>
            </div>
          );
        }

        // We have a valid ad:
        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

        // This is where we mark the cell as `.ad-item` with `data-ad-id`.
        // If your scheduledAd has an `adId` property, use that. Otherwise, you can pick something from `ad`.
        const adIdValue = adToDisplay.adId || ad._id || "";

        return (
          <div
            key={index}
            className="grid-cell ad-item"
            data-ad-id={adIdValue}
            style={{
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
              backgroundColor: "#fff",
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
