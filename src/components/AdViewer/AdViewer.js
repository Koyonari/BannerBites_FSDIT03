// AdViewer.js
import React from 'react';
import './AdViewer.css';

// Component to represent an individual Ad
const AdComponent = ({ type, content, styles }) => {
  // Use the mediaUrl or src directly from the content
  let mediaUrl = content.mediaUrl || content.src;

  // If mediaUrl is not provided, construct it using s3Bucket and s3Key
  if (!mediaUrl && content.s3Bucket && content.s3Key) {
    // Optionally, include s3Region if needed
    const s3Region = content.s3Region || 'ap-southeast-1'; // Replace with your region if different

    // Encode the s3Key properly to handle spaces and special characters
    const encodeS3Key = (key) => {
      return key
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
    };

    const encodedS3Key = encodeS3Key(content.s3Key);

    mediaUrl = `https://${content.s3Bucket}.s3.${s3Region}.amazonaws.com/${encodedS3Key}`;
  }

  return (
    <div className="ad-item" style={styles}>
      {type === 'text' && (
        <div>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === 'image' && (
        <div>
          <img src={mediaUrl} alt={content.title} style={{ maxWidth: '100%' }} />
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      )}
      {type === 'video' && (
        <div>
          <video controls style={{ width: '100%' }}>
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
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '10px',
        width: '100%',
        height: '100%',
      }}
    >
      {gridItems.map((item) => {
        if (!item || item.hidden) return null; // Skip null or hidden items

        const { index, row, column, scheduledAds, rowSpan, colSpan } = item;

        // Determine which ad to display based on the current time
        let adToDisplay = null;

        if (scheduledAds && scheduledAds.length > 0) {
          const now = new Date();
          // Find ads that are scheduled for now or earlier and filter those available
          const availableAds = scheduledAds.filter(
            (scheduledAd) => new Date(scheduledAd.scheduledDateTime) <= now
          );

          if (availableAds.length > 0) {
            // Get the latest ad that should be displayed right now
            adToDisplay = availableAds.reduce((latestAd, currentAd) =>
              new Date(currentAd.scheduledDateTime) > new Date(latestAd.scheduledDateTime)
                ? currentAd
                : latestAd
            );
          } else {
            // No ads available yet, select the next upcoming one
            adToDisplay = scheduledAds.reduce((nextAd, currentAd) =>
              new Date(currentAd.scheduledDateTime) < new Date(nextAd.scheduledDateTime)
                ? currentAd
                : nextAd
            );
          }
        }

        if (!adToDisplay) {
          return null; // No ad to display in this cell
        }

        const ad = adToDisplay.ad;
        const { type, content, styles } = ad;

        // Compute grid positions
        const gridRowStart = row + 1; // Convert 0-based to 1-based index
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
              border: '1px solid #ccc',
              padding: '10px',
              backgroundColor: '#fafafa',
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
