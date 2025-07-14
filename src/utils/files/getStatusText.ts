export const getStatusText = (status) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "uploading":
      return "Uploading...";
    case "completed":
      return "Complete";
    case "error":
      return "Error";
    case "processing":
      return "Processing file...";
    default:
      return "Pending";
  }
};
