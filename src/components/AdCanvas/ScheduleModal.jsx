import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
// ScheduleModal is a modal popup that allows the user to schedule an ad
const ScheduleModal = ({
  ad,
  scheduledTime: initialScheduledTime,
  onSave,
  onClose,
  existingScheduledTimes,
}) => {
  const [scheduledTime, setScheduledTime] = useState(
    initialScheduledTime && initialScheduledTime !== ""
      ? initialScheduledTime
      : "00:00",
  );
  const [error, setError] = useState("");

  // Handle Save button click
  const handleSave = () => {
    if (!existingScheduledTimes.includes(scheduledTime)) {
      onSave(scheduledTime);
    }
  };

  // Handle time change and validation
  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setScheduledTime(newTime);

    // Check if the selected time is already scheduled
    if (existingScheduledTimes.includes(newTime)) {
      setError(
        "This time slot is already scheduled. Please choose another time.",
      );
    } else {
      setError(""); // Clear the error if the time is valid
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm dark-bg"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md rounded-lg border shadow-lg light-bg dark:white-border dark:dark-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="primary-bg h-5 w-5" />
            <h2 className="neutral-text dark:neutral-text text-lg font-semibold">
              Schedule Ad
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:neutralalt-bg rounded-full p-1"
          >
            <X className="neutral-text h-5 w-5 dark:secondary-text hover:dark:primary-text" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <label className="block space-y-2">
            <span className="neutral-text text-lg font-medium dark:secondary-text">
              <b>Select Time</b>
            </span>
            <input
              type="time"
              value={scheduledTime}
              onChange={handleTimeChange}
              className={`block w-full rounded-md border-2 p-2 focus:outline-none focus:ring-2 ${
                error
                  ? "alert-border focus:alert-border"
                  : "focus:alert2-border"
              }`}
            />
          </label>
          {error && <p className="mt-2 text-sm alert-text">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="hover:neutral-bg neutral-text rounded-md px-4 py-2 text-sm font-medium dark:secondary-text hover:dark:primary-text"
          >
            <b>Cancel</b>
          </button>
          <button
            onClick={handleSave}
            disabled={!!error}
            className={`rounded-md px-4 py-2 text-sm font-medium secondary-text focus:outline-none focus:ring-2 ${
              error
                ? "neutral-bg cursor-not-allowed"
                : "primary-bg hover:secondary-bg"
            }`}
          >
            <b>Schedule</b>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
