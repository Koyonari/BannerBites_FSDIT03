// ScheduleModal.js
import React, { useState } from "react";

const ScheduleModal = ({ ad, onSave, onClose }) => {
  const [scheduledDateTime, setScheduledDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const handleSave = () => {
    onSave(scheduledDateTime);
  };

  return (
    <div className="modal">
      <h2>Schedule Ad</h2>
      <label>
        Scheduled Date and Time:
        <input
          type="datetime-local"
          value={scheduledDateTime}
          onChange={(e) => setScheduledDateTime(e.target.value)}
        />
      </label>
      <button onClick={handleSave}>Schedule</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default ScheduleModal;
