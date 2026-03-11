import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, X } from "lucide-react";
import {
  FightEvent,
  EventType,
  PlayerType,
  DEFAULT_PRESETS,
} from "../types/events";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<FightEvent, "id">) => Promise<boolean> | boolean;
  timestamp: number;
  formatTime: (seconds: number) => string;
  editingEvent?: FightEvent | null;
  defaultMatchNumber?: number;
}

export function AddEventModal({
  isOpen,
  onClose,
  onSave,
  timestamp,
  formatTime,
  editingEvent,
  defaultMatchNumber = 1,
}: AddEventModalProps) {
  const [player, setPlayer] = useState<PlayerType>(
    editingEvent?.player || "Me",
  );
  const [eventType, setEventType] = useState<EventType>(
    editingEvent?.type || "Position",
  );
  const [position, setPosition] = useState(editingEvent?.position || "");
  const [notes, setNotes] = useState(editingEvent?.notes || "");
  const [points, setPoints] = useState<string>(
    editingEvent?.points?.toString() || "",
  );
  const [matchNumber, setMatchNumber] = useState<number>(
    editingEvent?.matchNumber || defaultMatchNumber,
  );
  const [outcome, setOutcome] = useState<"success" | "failed">(
    editingEvent?.outcome || "success",
  );
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPositionValue, setCustomPositionValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const players: PlayerType[] = ["Me", "Opponent"];
  const eventTypes: EventType[] = [
    "Position",
    "Transition",
    "Submission",
    "Note",
  ];

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setPlayer(editingEvent?.player || "Me");
    setEventType(editingEvent?.type || "Position");
    setPosition(editingEvent?.position || "");
    setNotes(editingEvent?.notes || "");
    setPoints(editingEvent?.points?.toString() || "");
    setMatchNumber(editingEvent?.matchNumber || defaultMatchNumber);
    setOutcome(editingEvent?.outcome || "success");
    setIsCustomPosition(false);
    setCustomPositionValue("");
    setIsSaving(false);
  }, [isOpen, editingEvent, defaultMatchNumber]);

  const resetForm = () => {
    setPlayer("Me");
    setEventType("Position");
    setPosition("");
    setNotes("");
    setPoints("");
    setMatchNumber(defaultMatchNumber);
    setOutcome("success");
    setIsCustomPosition(false);
    setCustomPositionValue("");
    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const getPresetsForType = () => {
    switch (eventType) {
      case "Position":
        return DEFAULT_PRESETS.positions;
      case "Transition":
        return DEFAULT_PRESETS.transitions;
      case "Submission":
        return DEFAULT_PRESETS.submissions;
      case "Note":
        return DEFAULT_PRESETS.notes;
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    const finalPosition = isCustomPosition ? customPositionValue : position;
    if (!finalPosition.trim()) return;
    setIsSaving(true);
    const didSave = await onSave({
      timestamp: editingEvent?.timestamp ?? timestamp,
      player,
      type: eventType,
      position: finalPosition,
      notes,
      points: points ? parseInt(points, 10) : undefined,
      matchNumber,
      outcome,
    });
    setIsSaving(false);

    if (!didSave) return;

    resetForm();
    onClose();
  };

  return createPortal(
    <div
      className="fight-recap-theme  fixed inset-0 z-[1000]  flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        className="relative animate-lift-in grid w-full max-w-lg gap-4 max-h-[90vh] overflow-y-auto border border-border bg-card p-6 shadow-lg sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            {editingEvent ? "Edit Event" : "Add Event"}
          </h2>
        </div>

        <div className="space-y-5 py-1">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <span className="text-muted-foreground text-sm">Timestamp:</span>
            <span className="timestamp-badge text-base">
              {formatTime(editingEvent?.timestamp ?? timestamp)}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Player</Label>
            <div className="flex gap-2">
              {players.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setPlayer(item)}
                  disabled={isSaving}
                  className={`preset-btn flex-1 ${player === item ? "active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Event Type</Label>
            <div className="flex gap-2 flex-wrap">
              {eventTypes.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setEventType(item);
                    setPosition("");
                  }}
                  disabled={isSaving}
                  className={`preset-btn ${eventType === item ? "active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">
              {eventType === "Position"
                ? "Position"
                : eventType === "Transition"
                  ? "Transition Type"
                  : eventType === "Submission"
                    ? "Submission"
                    : "Note Type"}
            </Label>
            <div className="flex gap-2 flex-wrap  overflow-y-auto p-1">
              {getPresetsForType().map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => {
                    if (preset === "Other") {
                      setIsCustomPosition(true);
                      setPosition("");
                      return;
                    }

                    setIsCustomPosition(false);
                    setPosition(preset);
                  }}
                  disabled={isSaving}
                  className={`preset-btn text-xs ${
                    preset === "Other"
                      ? isCustomPosition
                        ? "active"
                        : ""
                      : position === preset && !isCustomPosition
                        ? "active"
                        : ""
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {isCustomPosition && (
              <Input
                placeholder={`Enter custom ${eventType.toLowerCase()}...`}
                value={customPositionValue}
                onChange={(event) => setCustomPositionValue(event.target.value)}
                autoFocus
                disabled={isSaving}
                className="mt-2 bg-secondary border-border text-foreground"
              />
            )}
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="text-foreground mb-2">Match Number</Label>
            <div className="inline-flex w-fit items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMatchNumber((prev) => Math.max(1, prev - 1))}
                disabled={isSaving || matchNumber <= 1}
                className="h-8 w-8 p-0 text-white"
              >
                -
              </Button>
              <span className="min-w-10 text-center font-semibold text-foreground">
                {matchNumber}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMatchNumber((prev) => prev + 1)}
                disabled={isSaving}
                className="h-8 w-8 p-0 text-white"
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Outcome</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOutcome("success")}
                disabled={isSaving}
                className={`preset-btn flex-1 ${outcome === "success" ? "active" : ""}`}
              >
                Success
              </button>
              <button
                type="button"
                onClick={() => setOutcome("failed")}
                disabled={isSaving}
                className={`preset-btn flex-1 ${outcome === "failed" ? "active" : ""}`}
              >
                Failed
              </button>
            </div>
          </div>

          {(eventType === "Transition" ||
            eventType === "Submission" ||
            eventType === "Position") && (
            <div className="space-y-2">
              <Label className="text-foreground flex">Points (optional)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                disabled={isSaving}
                placeholder="0"
                className="w-24 bg-secondary border-border text-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground flex">Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any observations or coaching notes..."
              rows={3}
              disabled={isSaving}
              className="bg-secondary border-border text-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isSaving ||
                (isCustomPosition ? !customPositionValue : !position)
              }
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : editingEvent ? (
                "Save Changes"
              ) : (
                "Add Event"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
