import { SearchX } from "lucide-react";
import React from "react";

const NoUsersFound = () => {
  return (
    <div className="text-center py-12">
      <SearchX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">No Users Found</p>
    </div>
  );
};

export default NoUsersFound;
