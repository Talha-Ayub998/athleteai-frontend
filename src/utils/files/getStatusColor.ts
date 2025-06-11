export const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-gray-200 dark:bg-gray-600";
    case "uploading":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-gray-200 dark:bg-gray-600";
  }
};
