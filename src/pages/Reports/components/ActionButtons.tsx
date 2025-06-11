import { Download, Trash2 } from "lucide-react";
import React from "react";

const ActionButtons = ({
  selectedItems,
  handleDelete,
  handleDownload,
  isDeleting,
  isDownloading,
}) => {
  return (
    <div>
      {selectedItems.size > 0 && (
        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading
              ? "Downloading..."
              : `Download (${selectedItems.size})`}
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : `Delete (${selectedItems.size})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
