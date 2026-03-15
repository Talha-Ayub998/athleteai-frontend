import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, FileSpreadsheet, Loader2, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

export interface FinalizeReportPayload {
  filename: string;
  athlete: {
    name: string;
    email: string;
    belt: string;
    gym: string;
    language: string;
  };
}

export interface FinalizeReportSubmitResult {
  success: boolean;
  errorMessage?: string;
}

interface FinalizeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilename?: string;
  onSubmit?: (
    payload: FinalizeReportPayload,
  ) => Promise<FinalizeReportSubmitResult> | FinalizeReportSubmitResult;
}

const DEFAULT_ATHLETE = {
  name: "",
  email: "",
  belt: "",
  gym: "",
  language: "English",
};

export function FinalizeReportModal({
  isOpen,
  onClose,
  initialFilename = "",
  onSubmit,
}: FinalizeReportModalProps) {
  const [filename, setFilename] = useState("");
  const [athleteName, setAthleteName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("");
  const [athleteBelt, setAthleteBelt] = useState("");
  const [athleteGym, setAthleteGym] = useState("");
  const [athleteLanguage, setAthleteLanguage] = useState(
    DEFAULT_ATHLETE.language,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setFilename(initialFilename);
    setAthleteName(DEFAULT_ATHLETE.name);
    setAthleteEmail(DEFAULT_ATHLETE.email);
    setAthleteBelt(DEFAULT_ATHLETE.belt);
    setAthleteGym(DEFAULT_ATHLETE.gym);
    setAthleteLanguage(DEFAULT_ATHLETE.language);
    setIsSubmitting(false);
    setSubmitError("");
  }, [isOpen, initialFilename]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const isFormComplete =
    filename.trim() &&
    athleteName.trim() &&
    athleteEmail.trim() &&
    athleteBelt.trim() &&
    athleteGym.trim() &&
    athleteLanguage.trim();

  const handleSubmit = async () => {
    if (!onSubmit || !isFormComplete) return;

    setIsSubmitting(true);
    setSubmitError("");
    const result = await onSubmit({
      filename: filename.trim(),
      athlete: {
        name: athleteName.trim(),
        email: athleteEmail.trim(),
        belt: athleteBelt.trim(),
        gym: athleteGym.trim(),
        language: athleteLanguage.trim(),
      },
    });
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.errorMessage || "Failed to finalize report.");
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fight-recap-theme fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        className="relative grid max-h-[90vh] w-full max-w-2xl gap-5 overflow-y-auto border border-border bg-card p-6 shadow-lg animate-lift-in sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="flex items-center gap-3 text-lg font-semibold leading-none tracking-tight text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            Finalize Report
          </h2>
          <p className="text-sm text-muted-foreground">
            Add the report filename and athlete details.
          </p>
        </div>

        <div className="grid gap-5 py-1">
          {submitError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="whitespace-pre-line">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Filename</Label>
            <Input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              placeholder="McClearySean_2026-03-06.xlsx"
              className="border-border bg-secondary text-foreground"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Athlete Name</Label>
              <Input
                value={athleteName}
                onChange={(event) => setAthleteName(event.target.value)}
                placeholder="Sean McCleary"
                className="border-border bg-secondary text-foreground"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input
                value={athleteEmail}
                onChange={(event) => setAthleteEmail(event.target.value)}
                placeholder="abc@gmail.com"
                className="border-border bg-secondary text-foreground"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Belt</Label>
              <Input
                value={athleteBelt}
                onChange={(event) => setAthleteBelt(event.target.value)}
                placeholder="Black"
                className="border-border bg-secondary text-foreground"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Gym</Label>
              <Input
                value={athleteGym}
                onChange={(event) => setAthleteGym(event.target.value)}
                placeholder="McCleary Jiu-Jitsu"
                className="border-border bg-secondary text-foreground"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Language</Label>
            <Input
              value={athleteLanguage}
              onChange={(event) => setAthleteLanguage(event.target.value)}
              placeholder="English"
              className="border-border bg-secondary text-foreground"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={!onSubmit || !isFormComplete || isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
