import React, { useState } from "react";
import { X, Calendar } from "lucide-react";

const ScheduleModal = ({ ad, onSave, onClose }) => {
  const [scheduledTime, setScheduledTime] = useState("00:00");

  const handleSave = () => {
    onSave(scheduledTime);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Schedule Ad</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <label className="block space-y-2">
            <span className="text-md font-medium text-gray-700">
              Select Time
            </span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="block w-full rounded-md border-2 p-2 focus:border-orange-500 focus:outline-none focus:ring-2"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
