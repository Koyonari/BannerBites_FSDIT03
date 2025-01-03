import React from "react";
import { X, Edit2, Trash2, Clock } from "lucide-react";

// AdListPopup is a modal popup that displays a list of scheduled ads
const AdListPopup = ({ scheduledAds, onClose, onEdit, onRemove }) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="neutralalt-bg fixed inset-0 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popup Content */}
      <div className="relative z-50 w-full max-w-2xl rounded-lg shadow-lg light-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold primary-text">Scheduled Ads</h3>
          <button
            onClick={onClose}
            className="hover:neutral-bg rounded-full p-1"
          >
            <X className="h-5 w-5 secondary-text" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {scheduledAds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="neutral-text h-12 w-12" />
              <p className="mt-2 primary-text">No scheduled ads yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {scheduledAds.map((scheduledAd) => (
                <li
                  key={scheduledAd.id}
                  className="rounded-lg border p-4 shadow-sm light-bg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium primary-text">
                        {scheduledAd.ad.content.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-1 text-sm light-text">
                        <Clock className="h-4 w-4" />
                        <span>Scheduled for: {scheduledAd.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onEdit(scheduledAd);
                        }}
                        className="hover:neutralalt-bg neutral-text rounded-md p-2"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemove(scheduledAd)}
                        className="rounded-md p-2 alert-text hover:alert-bg"
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
