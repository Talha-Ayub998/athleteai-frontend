import { useEffect, useMemo, useState } from "react";
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
  const [player, setPlayer] = useState<PlayerType>("Me");
  const [eventType, setEventType] = useState<EventType>("Position");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [points, setPoints] = useState("");
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [customPositionValue, setCustomPositionValue] = useState("");

  const players: PlayerType[] = ["Me", "Opponent", "AI Coach"];
  const eventTypes: EventType[] = ["Position", "Transition", "Submission", "Note"];

  const presetsForType = useMemo(() => {
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
  }, [eventType]);

  useEffect(() => {
    if (!isOpen) return;

    const event = editingEvent;
    if (!event) {
      setPlayer("Me");
      setEventType("Position");
      setPosition("");
      setNotes("");
      setPoints("");
      setIsCustomPosition(false);
      setCustomPositionValue("");
      return;
    }

    setPlayer(event.player);
    setEventType(event.type);
    setNotes(event.notes || "");
    setPoints(event.points?.toString() || "");

    const presetLookup = {
      Position: DEFAULT_PRESETS.positions,
      Transition: DEFAULT_PRESETS.transitions,
      Submission: DEFAULT_PRESETS.submissions,
      Note: DEFAULT_PRESETS.notes,
    } as const;

    if ((presetLookup[event.type] as readonly string[]).includes(event.position)) {
      setPosition(event.position);
      setIsCustomPosition(false);
      setCustomPositionValue("");
    } else {
      setPosition("");
      setIsCustomPosition(true);
      setCustomPositionValue(event.position);
    }
  }, [editingEvent, isOpen]);

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

  if (!isOpen) return null;

  const handleSave = () => {
    const finalPosition = isCustomPosition ? customPositionValue : position;
    if (!finalPosition) return;

    onSave({
      timestamp: editingEvent?.timestamp ?? timestamp,
      player,
      type: eventType,
      position: finalPosition,
      notes,
      points: points ? parseInt(points, 10) : undefined,
    });

    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-lg p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h2 className="text-foreground text-xl font-semibold flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </span>
            {editingEvent ? "Edit Event" : "Add Event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 py-2">
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
                    setIsCustomPosition(false);
                    setCustomPositionValue("");
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
              {presetsForType.map((preset) => (
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
                    setCustomPositionValue("");
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
              onClick={onClose}
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
