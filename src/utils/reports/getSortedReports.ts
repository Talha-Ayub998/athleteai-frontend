export const getSortedReports = (reports, sortConfig) => {
  const sortableItems = [...reports];
  if (!sortConfig.key) return sortableItems;

  sortableItems.sort((a, b) => {
    if (sortConfig.key === "original_name") {
      const nameA = a.original_name.toLowerCase();
      const nameB = b.original_name.toLowerCase();
      return sortConfig.direction === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else if (sortConfig.key === "size_bytes") {
      return sortConfig.direction === "asc"
        ? a.size_bytes - b.size_bytes
        : b.size_bytes - a.size_bytes;
    } else if (sortConfig.key === "last_modified") {
      const dateA = new Date(a.last_modified);
      const dateB = new Date(b.last_modified);
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
    return 0;
  });

  return sortableItems;
};
