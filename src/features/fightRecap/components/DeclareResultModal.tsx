import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Trophy, X } from "lucide-react";
import type { MatchResult } from "../types/events";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

export interface DeclareMatchResultPayload {
  match_number: number;
  result: "Win" | "Lost" | "Draw";
  match_type: "No-GI Points" | "GI Points";
  referee_decision: boolean;
  disqualified: boolean;
  opponent: string;
}

interface DeclareResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchNumber: number;
  editingResult?: MatchResult | null;
  onSubmit: (
    payload: DeclareMatchResultPayload,
  ) => Promise<boolean> | boolean;
}

const RESULT_OPTIONS: DeclareMatchResultPayload["result"][] = [
  "Win",
  "Lost",
  "Draw",
];

const MATCH_TYPE_OPTIONS: DeclareMatchResultPayload["match_type"][] = [
  "No-GI Points",
  "GI Points",
];

const normalizeResultValue = (
  value?: string | null,
): DeclareMatchResultPayload["result"] => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "draw") return "Draw";
  if (
    normalized === "lose" ||
    normalized === "loss" ||
    normalized === "lost"
  ) {
    return "Lost";
  }
  return "Win";
};

const normalizeMatchTypeValue = (
  value?: string | null,
): DeclareMatchResultPayload["match_type"] => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "gi points" || normalized === "gi") {
    return "GI Points";
  }
  return "No-GI Points";
};

export function DeclareResultModal({
  isOpen,
  onClose,
  matchNumber,
  editingResult,
  onSubmit,
}: DeclareResultModalProps) {
  const [result, setResult] =
    useState<DeclareMatchResultPayload["result"]>("Win");
  const [matchType, setMatchType] =
    useState<DeclareMatchResultPayload["match_type"]>("No-GI Points");
  const [refereeDecision, setRefereeDecision] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setResult(normalizeResultValue(editingResult?.result));
    setMatchType(normalizeMatchTypeValue(editingResult?.matchType));
    setRefereeDecision(editingResult?.refereeDecision ?? false);
    setDisqualified(editingResult?.disqualified ?? false);
    setOpponent(editingResult?.opponent ?? "");
    setIsSubmitting(false);
  }, [isOpen, matchNumber, editingResult]);

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

  const handleSubmit = async () => {
    const trimmedOpponent = opponent.trim();
    if (!trimmedOpponent) return;

    setIsSubmitting(true);
    const didSubmit = await onSubmit({
      match_number: matchNumber,
      result,
      match_type: matchType,
      referee_decision: refereeDecision,
      disqualified,
      opponent: trimmedOpponent,
    });
    setIsSubmitting(false);

    if (!didSubmit) return;
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fight-recap-theme fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        className="relative animate-lift-in grid w-full max-w-lg gap-4 max-h-[90vh] overflow-y-auto border border-border bg-card p-6 shadow-lg sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            {editingResult ? "Edit Match Result" : "Declare Match Result"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Match {matchNumber}
          </p>
        </div>

        <div className="space-y-5 py-1">
          <div className="space-y-2">
            <Label className="text-foreground flex">Result</Label>
            <div className="grid grid-cols-3 gap-2">
              {RESULT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setResult(option)}
                  disabled={isSubmitting}
                  className={`preset-btn ${result === option ? "active" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Match Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {MATCH_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMatchType(option)}
                  disabled={isSubmitting}
                  className={`preset-btn ${matchType === option ? "active" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Referee Decision</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefereeDecision(true)}
                disabled={isSubmitting}
                className={`preset-btn ${refereeDecision ? "active" : ""}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRefereeDecision(false)}
                disabled={isSubmitting}
                className={`preset-btn ${!refereeDecision ? "active" : ""}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Disqualified</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDisqualified(true)}
                disabled={isSubmitting}
                className={`preset-btn ${disqualified ? "active" : ""}`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setDisqualified(false)}
                disabled={isSubmitting}
                className={`preset-btn ${!disqualified ? "active" : ""}`}
              >
                No
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Opponent Name</Label>
            <Input
              value={opponent}
              onChange={(event) => setOpponent(event.target.value)}
              disabled={isSubmitting}
              placeholder="Enter opponent name"
              className="bg-secondary border-border text-foreground"
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
              onClick={handleSubmit}
              disabled={isSubmitting || !opponent.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingResult ? "Saving..." : "Declaring..."}
                </>
              ) : (
                editingResult ? "Save Result" : "Declare Result"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
