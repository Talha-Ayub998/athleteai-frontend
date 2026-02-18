import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function FightRecapNotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent fight recap route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex h-screen items-center justify-center bg-muted">
      <div className="text-center px-4">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <Link
          to="/fight-recap"
          className="text-primary underline hover:text-primary/90"
        >
          Return to Fight Recap
        </Link>
      </div>
    </div>
  );
}
