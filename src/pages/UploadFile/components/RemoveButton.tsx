import { X } from "lucide-react";
import React from "react";

const RemoveButton = ({ file, removeFile }) => {
  return (
    <button
      onClick={() => removeFile(file.id)}
      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
    >
      <X className="w-4 h-4" />
    </button>
  );
};

export default RemoveButton;
