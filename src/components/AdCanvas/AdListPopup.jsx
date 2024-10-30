// AdListPopup.js
import React from "react";

const AdListPopup = ({ scheduledAds, onClose, onEdit, onRemove }) => {
  return (
    <div className="popup">
      <div className="popup-content">
        <h3>Scheduled Ads</h3>
        <ul>
          {scheduledAds.map((scheduledAd) => (
            <li key={scheduledAd.id}>
              <p>
                <strong>{scheduledAd.ad.content.title}</strong>
                <br />
                Scheduled for: {scheduledAd.scheduledTime}
              </p>
              <button onClick={() => onEdit(scheduledAd)}>Edit</button>
              <button onClick={() => onRemove(scheduledAd)}>Remove</button>
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AdListPopup;
