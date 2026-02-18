import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { FightEvent, EventType, PlayerType, DEFAULT_PRESETS } from "../types/events";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/Textarea";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<FightEvent, "id">) => void;
  timestamp: number;
  formatTime: (seconds: number) => string;
  editingEvent?: FightEvent | null;
}

export function AddEventModal({
  isOpen,
  onClose,
  onSave,
  timestamp,
  formatTime,
  editingEvent,
}: AddEventModalProps) {
  const [player, setPlayer] = useState<PlayerType>(editingEvent?.player || "Me");
  const [eventType, setEventType] = useState<EventType>(
    editingEvent?.type || "Position"
  );
  const [position, setPosition] = useState(editingEvent?.position || "");
  const [notes, setNotes] = useState(editingEvent?.notes || "");
  const [points, setPoints] = useState<string>(
    editingEvent?.points?.toString() || ""
  );
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPositionValue, setCustomPositionValue] = useState("");

  const players: PlayerType[] = ["Me", "Opponent", "AI Coach"];
  const eventTypes: EventType[] = ["Position", "Transition", "Submission", "Note"];

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

  const resetForm = () => {
    setPlayer("Me");
    setEventType("Position");
    setPosition("");
    setNotes("");
    setPoints("");
    setIsCustomPosition(false);
    setCustomPositionValue("");
  };

  const handleClose = () => {
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

  const handleSave = () => {
    const finalPosition = isCustomPosition ? customPositionValue : position;
    if (!finalPosition.trim()) return;
    onSave({
      timestamp: editingEvent?.timestamp ?? timestamp,
      player,
      type: eventType,
      position: finalPosition,
      notes,
      points: points ? parseInt(points, 10) : undefined,
    });
    resetForm();
    onClose();
  };

  return createPortal(
    <div
      className="fight-recap-theme fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        className="relative grid w-full max-w-lg gap-4 border border-border bg-card p-6 shadow-lg sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
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
            <Label className="text-foreground">Player</Label>
            <div className="flex gap-2">
              {players.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setPlayer(item)}
                  className={`preset-btn flex-1 ${player === item ? "active" : ""}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Event Type</Label>
            <div className="flex gap-2 flex-wrap">
              {eventTypes.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setEventType(item);
                    setPosition("");
                  }}
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
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-1">
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
                className="mt-2 bg-secondary border-border text-foreground"
              />
            )}
          </div>

          {(eventType === "Transition" ||
            eventType === "Submission" ||
            eventType === "Position") && (
            <div className="space-y-2">
              <Label className="text-foreground">Points (optional)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                placeholder="0"
                className="w-24 bg-secondary border-border text-foreground"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any observations or coaching notes..."
              rows={3}
              className="bg-secondary border-border text-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCustomPosition ? !customPositionValue : !position}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editingEvent ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
