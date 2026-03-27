import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import "../fightRecap.css";
import { useUpload } from "../context/UploadContext";

const FALLBACK_ROUTE = "/reports";

export default function FightRecapLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUploading, uploadProgress } = useUpload();

  const isOnUploadPage = location.pathname.endsWith("/upload");
  const showIndicator = isUploading && !isOnUploadPage;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(FALLBACK_ROUTE);
  };

  return (
    <section className="fight-recap-theme bg-background">
      <div className="px-4 py-2 border-b border-border bg-background sticky top-0 z-30">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex py-2 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <Outlet />
      <div className="h-40" />

      {showIndicator && (
        <button
          type="button"
          onClick={() => navigate("upload")}
          className="group fixed bottom-6 right-6 z-50 flex items-center gap-0 overflow-hidden rounded-full border border-border bg-card shadow-lg transition-all duration-300 hover:gap-2 hover:pr-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-foreground transition-all duration-300 group-hover:max-w-xs">
            Uploading video {uploadProgress}%
          </span>
        </button>
      )}
    </section>
  );
}
