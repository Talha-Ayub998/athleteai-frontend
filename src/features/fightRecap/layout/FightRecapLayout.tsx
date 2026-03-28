import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import "../fightRecap.css";
import { useUpload } from "../context/UploadContext";

const FALLBACK_ROUTE = "/reports";

export default function FightRecapLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUploading, uploadProgress, uploadResult } = useUpload();

  const isOnUploadPage = location.pathname.endsWith("/upload");
  const isOnUploadPageRef = useRef(isOnUploadPage);
  isOnUploadPageRef.current = isOnUploadPage;

  const [showSuccess, setShowSuccess] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!uploadResult) return;
    if (isOnUploadPageRef.current) return;

    setShowSuccess(true);
    setIsFading(false);
    const fadeTimer = setTimeout(() => setIsFading(true), 1200);
    const removeTimer = setTimeout(() => {
      setShowSuccess(false);
      setIsFading(false);
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [uploadResult]);

  const showIndicator = (isUploading || showSuccess) && !isOnUploadPage;

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
          onClick={() => !showSuccess && navigate("upload")}
          className={`group fixed bottom-6 right-6 z-50 flex items-center gap-0 overflow-hidden rounded-full border bg-card shadow-lg transition-all duration-300 hover:gap-2 hover:pr-4 ${
            showSuccess
              ? "border-green-500/40 pointer-events-none"
              : "border-border"
          } ${isFading ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 500ms, gap 300ms, padding 300ms" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            {showSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium text-foreground transition-all duration-300 group-hover:max-w-xs">
            {showSuccess
              ? "Upload complete"
              : `Uploading video ${uploadProgress}%`}
          </span>
        </button>
      )}
    </section>
  );
}
