import React, { useState } from "react";

const ScheduleModal = ({ ad, onSave, onClose }) => {
  const [scheduledTime, setScheduledTime] = useState("00:00");

  const handleSave = () => {
    onSave(scheduledTime);
  };

  return (
    <div className="modal">
      <h2>Schedule Ad</h2>
      <label>
        Scheduled Time:
        <input
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
        />
      </label>
      <button onClick={handleSave}>Schedule</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default ScheduleModal;
