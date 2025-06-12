import React from "react";
import { Image, Video, Music, FileText, File } from "lucide-react"; // adjust imports if needed

const FileIcon = ({ fileName }) => {
  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return <Image className="w-5 h-5 text-blue-500" />;
  }
  if (["mp4", "avi", "mov", "wmv", "flv"].includes(extension)) {
    return <Video className="w-5 h-5 text-purple-500" />;
  }
  if (["mp3", "wav", "flac", "aac"].includes(extension)) {
    return <Music className="w-5 h-5 text-green-500" />;
  }
  if (["pdf", "doc", "docx", "txt"].includes(extension)) {
    return <FileText className="w-5 h-5 text-red-500" />;
  }

  return <File className="w-5 h-5 text-gray-500" />;
};

export default FileIcon;
