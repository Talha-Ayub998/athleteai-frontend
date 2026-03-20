import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Plus, X } from "lucide-react";
import {
  FightEvent,
  PlayerType,
  DEFAULT_PRESETS,
  EVENT_TYPES,
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
  maxTimestamp?: number;
  formatTime: (seconds: number) => string;
  editingEvent?: FightEvent | null;
  defaultMatchNumber?: number;
}

type TimestampPart = "hours" | "minutes" | "seconds";

interface TimestampParts {
  hours: string;
  minutes: string;
  seconds: string;
}

const padTimestampPart = (value: number) => String(value).padStart(2, "0");

const getTimestampParts = (valueInSeconds: number): TimestampParts => {
  const safeSeconds = Math.max(0, Math.floor(valueInSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return {
    hours: padTimestampPart(hours),
    minutes: padTimestampPart(minutes),
    seconds: padTimestampPart(seconds),
  };
};

const getTimestampSeconds = (parts: TimestampParts): number | null => {
  if (!parts.hours || !parts.minutes || !parts.seconds) {
    return null;
  }

  const hours = Number(parts.hours);
  const minutes = Number(parts.minutes);
  const seconds = Number(parts.seconds);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
};

export function AddEventModal({
  isOpen,
  onClose,
  onSave,
  timestamp,
  maxTimestamp,
  formatTime,
  editingEvent,
  defaultMatchNumber = 1,
}: AddEventModalProps) {
  const [player, setPlayer] = useState<PlayerType>(
    editingEvent?.player || "Me",
  );
  const [eventType, setEventType] = useState(
    editingEvent?.type || EVENT_TYPES[0],
  );
  const [timestampParts, setTimestampParts] = useState<TimestampParts>(
    getTimestampParts(editingEvent?.timestamp ?? timestamp),
  );
  const [moveName, setMoveName] = useState(editingEvent?.moveName || "");
  const [moveSearch, setMoveSearch] = useState("");
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
  const [isSaving, setIsSaving] = useState(false);
  const hoursInputRef = useRef<HTMLInputElement | null>(null);
  const minutesInputRef = useRef<HTMLInputElement | null>(null);
  const secondsInputRef = useRef<HTMLInputElement | null>(null);

  const players: PlayerType[] = ["Me", "Opponent"];
  const eventTypes = EVENT_TYPES;

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
    setEventType(editingEvent?.type || EVENT_TYPES[0]);
    setTimestampParts(getTimestampParts(editingEvent?.timestamp ?? timestamp));
    setMoveName(editingEvent?.moveName || "");
    setMoveSearch("");
    setNotes(editingEvent?.notes || "");
    setPoints(editingEvent?.points?.toString() || "");
    setMatchNumber(editingEvent?.matchNumber || defaultMatchNumber);
    setOutcome(editingEvent?.outcome || "success");
    setIsSaving(false);
  }, [isOpen, editingEvent, defaultMatchNumber]);

  const resetForm = () => {
    setPlayer("Me");
    setEventType(EVENT_TYPES[0]);
    setTimestampParts(getTimestampParts(timestamp));
    setMoveName("");
    setMoveSearch("");
    setNotes("");
    setPoints("");
    setMatchNumber(defaultMatchNumber);
    setOutcome("success");
    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const getPresetsForType = (): readonly string[] => {
    return DEFAULT_PRESETS.movesByEventType[eventType] || [];
  };

  if (!isOpen) return null;

  const presetsForType = getPresetsForType();
  const normalizedMoveSearch = moveSearch.trim().toLowerCase();
  const shouldShowMoveSearch = presetsForType.length > 10;
  const hasDurationLimit =
    typeof maxTimestamp === "number" &&
    Number.isFinite(maxTimestamp) &&
    maxTimestamp > 0;
  const filteredPresets = normalizedMoveSearch
    ? presetsForType.filter((preset) =>
        preset.toLowerCase().includes(normalizedMoveSearch),
      )
    : presetsForType;
  const parsedEventTimestamp = getTimestampSeconds(timestampParts);
  const isTimestampComplete =
    Boolean(timestampParts.hours) &&
    Boolean(timestampParts.minutes) &&
    Boolean(timestampParts.seconds);
  const isTimestampInRange =
    parsedEventTimestamp !== null &&
    (!hasDurationLimit || parsedEventTimestamp <= (maxTimestamp ?? 0));
  const timestampErrorMessage = !isTimestampComplete
    ? "Complete the full timestamp."
    : parsedEventTimestamp === null
      ? "Minutes and seconds must be between 00 and 59."
      : hasDurationLimit && parsedEventTimestamp > (maxTimestamp ?? 0)
        ? `Timestamp cannot be greater than ${formatTime(maxTimestamp ?? 0)}.`
        : "";

  const renderHighlightedMoveName = (preset: string) => {
    if (!normalizedMoveSearch) {
      return preset;
    }

    const lowerPreset = preset.toLowerCase();
    const matches: Array<{ start: number; end: number }> = [];
    let searchIndex = 0;

    while (searchIndex < preset.length) {
      const matchIndex = lowerPreset.indexOf(normalizedMoveSearch, searchIndex);
      if (matchIndex === -1) {
        break;
      }

      matches.push({
        start: matchIndex,
        end: matchIndex + normalizedMoveSearch.length,
      });
      searchIndex = matchIndex + normalizedMoveSearch.length;
    }

    if (matches.length === 0) {
      return preset;
    }

    const content: ReactNode[] = [];
    let contentIndex = 0;

    matches.forEach((match, index) => {
      if (match.start > contentIndex) {
        content.push(preset.slice(contentIndex, match.start));
      }

      content.push(
        <span
          key={`${preset}-${match.start}-${index}`}
          className="rounded-xs bg-primary/20 text-primary-foreground"
        >
          {preset.slice(match.start, match.end)}
        </span>,
      );
      contentIndex = match.end;
    });

    if (contentIndex < preset.length) {
      content.push(preset.slice(contentIndex));
    }

    return content;
  };

  const handleSave = async () => {
    if (!moveName.trim() || !isTimestampInRange) return;
    setIsSaving(true);
    const didSave = await onSave({
      timestamp: parsedEventTimestamp ?? 0,
      player,
      type: eventType,
      moveName,
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

  const getTimestampInputRef = (part: TimestampPart) => {
    if (part === "hours") return hoursInputRef;
    if (part === "minutes") return minutesInputRef;
    return secondsInputRef;
  };

  const focusNextTimestampInput = (part: TimestampPart) => {
    if (part === "hours") {
      minutesInputRef.current?.focus();
      minutesInputRef.current?.select();
      return;
    }

    if (part === "minutes") {
      secondsInputRef.current?.focus();
      secondsInputRef.current?.select();
    }
  };

  const focusPreviousTimestampInput = (part: TimestampPart) => {
    if (part === "seconds") {
      minutesInputRef.current?.focus();
      minutesInputRef.current?.select();
      return;
    }

    if (part === "minutes") {
      hoursInputRef.current?.focus();
      hoursInputRef.current?.select();
    }
  };

  const handleTimestampPartChange = (part: TimestampPart, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 2) {
      return;
    }

    const nextValue = value;
    const nextNumericValue = nextValue === "" ? null : Number(nextValue);

    if (
      (part === "minutes" || part === "seconds") &&
      nextNumericValue !== null &&
      nextNumericValue > 59
    ) {
      return;
    }

    const nextParts = {
      ...timestampParts,
      [part]: nextValue,
    };
    const nextTimestamp = getTimestampSeconds(nextParts);

    if (
      nextTimestamp !== null &&
      hasDurationLimit &&
      nextTimestamp > (maxTimestamp ?? 0)
    ) {
      return;
    }

    setTimestampParts(nextParts);

    if (nextValue.length === 2) {
      focusNextTimestampInput(part);
    }
  };

  const handleTimestampPartKeyDown = (
    part: TimestampPart,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !timestampParts[part]) {
      focusPreviousTimestampInput(part);
    }
  };

  const handleTimestampPartBlur = (part: TimestampPart) => {
    const currentValue = timestampParts[part];

    if (!currentValue) {
      setTimestampParts((prev) => ({
        ...prev,
        [part]: "00",
      }));
      return;
    }

    setTimestampParts((prev) => ({
      ...prev,
      [part]: currentValue.padStart(2, "0"),
    }));
  };

  const renderTimestampInput = (
    part: TimestampPart,
    label: string,
    placeholder: string,
  ) => (
    <div className="flex items-center gap-2">
      <Input
        ref={getTimestampInputRef(part)}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={timestampParts[part]}
        onChange={(event) =>
          handleTimestampPartChange(part, event.target.value)
        }
        onKeyDown={(event) => handleTimestampPartKeyDown(part, event)}
        onBlur={() => handleTimestampPartBlur(part)}
        onFocus={(event) => event.target.select()}
        disabled={isSaving}
        placeholder={placeholder}
        aria-label={label}
        className="w-16 bg-secondary border-border px-2 text-center text-foreground"
      />
      {/* <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span> */}
    </div>
  );

  const previewTimestamp =
    parsedEventTimestamp ?? editingEvent?.timestamp ?? timestamp;

  const maxTimestampParts = hasDurationLimit
    ? getTimestampParts(maxTimestamp ?? 0)
    : null;

  const maxTimestampDisplay = maxTimestampParts
    ? `${maxTimestampParts.hours}:${maxTimestampParts.minutes}:${maxTimestampParts.seconds}`
    : null;

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
              {formatTime(previewTimestamp)}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex">Timestamp</Label>
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3">
              {renderTimestampInput("hours", "Hours", "HH")}
              <span className="text-sm font-semibold text-muted-foreground">
                :
              </span>
              {renderTimestampInput("minutes", "Minutes", "MM")}
              <span className="text-sm font-semibold text-muted-foreground">
                :
              </span>
              {renderTimestampInput("seconds", "Seconds", "SS")}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasDurationLimit
                ? `Enter a value between 00:00:00 and ${maxTimestampDisplay}.`
                : "Enter a valid HH:MM:SS timestamp."}
            </p>
            {timestampErrorMessage && (
              <p className="text-xs text-red-400">{timestampErrorMessage}</p>
            )}
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
                    setMoveName("");
                    setMoveSearch("");
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
              Moves ({presetsForType.length})
            </Label>
            {shouldShowMoveSearch && (
              <Input
                value={moveSearch}
                onChange={(event) => setMoveSearch(event.target.value)}
                placeholder="Search moves..."
                disabled={isSaving}
                className="bg-secondary mt-2 border-border text-foreground"
              />
            )}
            <div className="flex gap-2 flex-wrap  overflow-y-auto p-1">
              {filteredPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setMoveName(preset)}
                  disabled={isSaving}
                  className={`preset-btn text-xs ${
                    moveName === preset ? "active" : ""
                  }`}
                >
                  {renderHighlightedMoveName(preset)}
                </button>
              ))}
              {filteredPresets.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">
                  No moves found.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label className="text-foreground mb-2">Match Number</Label>
            <div className="inline-flex w-fit items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMatchNumber((prev) => Math.max(1, prev - 1))}
                // disabled={isSaving || matchNumber <= 1}
                disabled={true}
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
                // disabled={isSaving}
                disabled={true}
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
              disabled={isSaving || !moveName || !isTimestampInRange}
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
