export const getSortedReports = (reports, sortConfig) => {
  const sortableItems = [...reports];
  if (!sortConfig.key) return sortableItems;

  sortableItems.sort((a, b) => {
    if (sortConfig.key === "original_name" || sortConfig.key === "filename") {
      const nameA = (a.filename || "").toLowerCase();
      const nameB = (b.filename || "").toLowerCase();
      return sortConfig.direction === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else if (sortConfig.key === "file_size_mb") {
      return sortConfig.direction === "asc"
        ? (a.file_size_mb || 0) - (b.file_size_mb || 0)
        : (b.file_size_mb || 0) - (a.file_size_mb || 0);
    } else if (sortConfig.key === "uploaded_at") {
      const dateA = new Date(a.uploaded_at).getTime();
      const dateB = new Date(b.uploaded_at).getTime();
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  return sortableItems;
};
