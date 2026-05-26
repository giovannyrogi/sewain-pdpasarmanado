export const normalizeStoredUploadPath = (filePath) => {
  if (!filePath || typeof filePath !== "string") return "";

  return filePath.replace(/^(\/api)+(?=\/uploads\/)/, "");
};

export const getUploadApiUrl = (filePath) => {
  const normalizedPath = normalizeStoredUploadPath(filePath);

  if (!normalizedPath) return "";
  if (normalizedPath.startsWith("blob:")) return normalizedPath;
  if (normalizedPath.startsWith("/uploads/")) return `/api${normalizedPath}`;

  return normalizedPath;
};
