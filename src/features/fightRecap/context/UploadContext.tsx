import { createContext, useContext, useEffect } from "react";
import { useMultipartUpload } from "../hooks/useMultipartUpload";

type UploadContextValue = ReturnType<typeof useMultipartUpload>;

const UploadContext = createContext<UploadContextValue | null>(null);

interface UploadProviderProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function UploadProvider({ children, onSuccess }: UploadProviderProps) {
  const upload = useMultipartUpload();

  useEffect(() => {
    if (upload.uploadResult) {
      onSuccess?.();
    }
  }, [upload.uploadResult, onSuccess]);

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
