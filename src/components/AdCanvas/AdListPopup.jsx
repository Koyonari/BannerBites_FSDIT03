import React from "react";
import { X, Edit2, Trash2, Clock } from "lucide-react";

// AdListPopup is a modal popup that displays a list of scheduled ads
const AdListPopup = ({ scheduledAds, onClose, onEdit, onRemove }) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup Content */}
      <div className="relative z-50 w-full max-w-2xl rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Ads</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {scheduledAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-gray-300" />
              <p className="mt-2 text-gray-500">No scheduled ads yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {scheduledAds.map((scheduledAd) => (
                <li
                  key={scheduledAd.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {scheduledAd.ad.content.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Scheduled for: {scheduledAd.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onEdit(scheduledAd);
                        }}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemove(scheduledAd)}
                        className="rounded-md p-2 text-red-500 hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdListPopup;
