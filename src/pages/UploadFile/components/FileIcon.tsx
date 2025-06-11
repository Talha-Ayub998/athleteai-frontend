import { File, FileText, Image, Music, Video } from "lucide-react";
import React from "react";

const FileIcon = ({ file }) => {
  const getFileIcon = (type) => {
    if (type.startsWith("image/"))
      return <Image className="w-5 h-5 text-blue-500" />;
    if (type.startsWith("video/"))
      return <Video className="w-5 h-5 text-purple-500" />;
    if (type.startsWith("audio/"))
      return <Music className="w-5 h-5 text-green-500" />;
    if (
      type.includes("pdf") ||
      type.includes("document") ||
      type.includes("text")
    )
      return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };
  return (
    <div className="flex-shrink-0 mr-3">
      {file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className="w-10 h-10 object-cover rounded-md"
        />
      ) : (
        <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center">
          {getFileIcon(file.type)}
        </div>
      )}
    </div>
  );
};

export default FileIcon;
