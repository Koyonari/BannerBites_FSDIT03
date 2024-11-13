// ScheduleModal.jsx
import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";

const ScheduleModal = ({ ad, onSave, onClose, existingScheduledTimes = [] }) => {
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState("");

  // Reset error when modal opens or scheduledTime changes
  useEffect(() => {
    setError("");
  }, [scheduledTime]);

  const handleSave = () => {
    if (!scheduledTime) {
      setError("Please select a time.");
      return;
    }

    if (existingScheduledTimes.includes(scheduledTime)) {
      setError(`The time "${scheduledTime}" is already scheduled.`);
      return;
    }

    // If no errors, proceed to save
    onSave(scheduledTime);
  };

  const handleTimeChange = (e) => {
    const selectedTime = e.target.value;
    setScheduledTime(selectedTime);

    if (existingScheduledTimes.includes(selectedTime)) {
      setError(`The time "${selectedTime}" is already scheduled.`);
    } else {
      setError("");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-white shadow-lg dark:border-white dark:bg-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schedule Ad
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-white hover:dark:text-black" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <label className="block space-y-2">
            <span className="text-lg font-medium text-gray-700 dark:text-white">
              <b>Select Time</b>
            </span>
            <input
              type="time"
              value={scheduledTime}
              onChange={handleTimeChange}
              className={`block w-full rounded-md border-2 p-2 focus:border-orange-500 focus:outline-none focus:ring-2 ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : ""
              }`}
              required
            />
          </label>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-white hover:dark:text-black"
          >
            <b>Cancel</b>
          </button>
          <button
            onClick={handleSave}
            disabled={!scheduledTime || error}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              !scheduledTime || error
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
