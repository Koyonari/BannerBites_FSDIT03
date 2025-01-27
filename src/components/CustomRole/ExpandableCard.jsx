import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ExpandableCard = ({ role, permissions, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPermissionName = (permission) => {
    return permission
      .split(/(?=[A-Z])/)
      .join(" ")
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="mb-4 rounded-lg border-2 p-6 transition-all duration-200 primary-border light-bg hover:border-blue-500 dark:secondary-border dark:dark-bg dark:hover:border-blue-500">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-xl font-semibold accent-text">{role}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded bg-[#2d3545] px-4 py-1.5 text-text-dark transition-colors duration-200 hover:bg-[#3a4355]"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded px-4 py-1.5 text-text-dark transition-colors duration-200 alert-bg"
          >
            Delete
          </button>
        </div>
      </div>

      <div
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm text-gray-500">Permissions</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>

      <div
        className={`grid grid-cols-2 gap-x-8 gap-y-3 overflow-hidden transition-all duration-300 ${
          isExpanded ? "mt-4 max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {Object.entries(permissions).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <span className="min-w-[140px] text-gray-400">
              {formatPermissionName(key)}:
            </span>
            <span
              className={`ml-2 ${
                value ? "text-green-600 dark:text-green-400" : "text-gray-500"
              }`}
            >
              {value ? "Yes" : "No"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpandableCard;
