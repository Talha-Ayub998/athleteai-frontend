import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "../fightRecap.css";

const FALLBACK_ROUTE = "/reports";

export default function FightRecapLayout() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(FALLBACK_ROUTE);
  };

  return (
    <section className="fight-recap-theme">
      <div className="px-6 py-4 border-b border-border bg-background sticky top-0 z-30">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <Outlet />
    </section>
  );
}
