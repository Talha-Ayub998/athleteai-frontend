import { createContext, useContext } from "react";
import { useMultipartUpload } from "../hooks/useMultipartUpload";

type UploadContextValue = ReturnType<typeof useMultipartUpload>;

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const upload = useMultipartUpload();
  return (
    <UploadContext.Provider value={upload}>{children}</UploadContext.Provider>
  );
}

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};
