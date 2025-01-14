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
        className="fixed inset-0 blur-sm backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
<<<<<<< HEAD
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Schedule Ad</h2>
=======
      <div className="relative z-50 w-full max-w-md rounded-lg border shadow-lg light-bg dark:white-border dark:dark-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 accent-text" />
            <h2 className="text-lg font-semibold neutral-text dark:neutral-text">
              Schedule Ad
            </h2>
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:neutralalt-bg"
          >
<<<<<<< HEAD
            <X className="h-5 w-5 text-gray-500" />
=======
            <X className="h-5 w-5 neutral-text dark:secondary-text hover:dark:primary-text" />
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <label className="block space-y-2">
<<<<<<< HEAD
            <span className="text-md font-medium text-gray-700">
              Select Time
=======
            <span className="text-lg font-medium neutral-text dark:secondary-text">
              <b>Select Time</b>
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
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
<<<<<<< HEAD
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
=======
            className="rounded-md px-4 py-2 text-sm font-medium neutral-text hover:neutral-bg dark:secondary-text hover:dark:primary-text"
>>>>>>> 4159325dc39cd13b0d48379cc2e0160be3fa773b
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!error}
            className={`rounded-md px-4 py-2 text-sm font-medium secondary-text focus:outline-none focus:ring-2 ${
              error
                ? "cursor-not-allowed neutral-bg"
                : "primary-bg hover:secondary-bg"
            }`}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
