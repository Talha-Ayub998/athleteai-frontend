import { AlertCircle } from "lucide-react";
import React from "react";

const VideoUploadGuides = () => {
  return (
    <div className="rounded-2xl border border-gray-200 dark:bg-white/[0.03] bg-white dark:border-gray-800 p-8">
      <h3 className="text-lg font-semibold text-blue-400 dark:text-blue-400 mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-400 dark:text-blue-400" />
        Video Upload Guidelines
      </h3>
      <ul className="space-y-3 text-gray-900 dark:text-white">
        <li className="flex items-start gap-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
          <span>
            Only <strong>YouTube</strong> or <strong>Google Drive</strong> links
            are supported.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
          <span>
            <strong>YouTube</strong>: Set video to <em>Unlisted</em> or{" "}
            <em>Public</em>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
          <span>
            <strong>Google Drive</strong>: Set link sharing to{" "}
            <em>Anyone with the link can view</em>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
          <span>Copy your video link and paste it below.</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
          <span>
            Make sure the video is clear and focused on your performance.
          </span>
        </li>
      </ul>
    </div>
  );
};

export default VideoUploadGuides;
