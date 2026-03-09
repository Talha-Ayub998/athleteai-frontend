import { useState } from "react";
import { Check, Edit2, X } from "lucide-react";
import {
  MatchType,
  BeltLevel,
  CompetitionPreset,
  DEFAULT_PRESETS,
  MatchMetadata,
} from "../types/events";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface MatchMetadataBarProps {
  metadata: MatchMetadata;
  onMetadataChange: (metadata: MatchMetadata) => void;
}

export function MatchMetadataBar({
  metadata,
  onMetadataChange,
}: MatchMetadataBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingMetadata, setEditingMetadata] =
    useState<MatchMetadata>(metadata);
  const [customCompetition, setCustomCompetition] = useState("");

  const matchTypes: MatchType[] = ["Gi", "No-Gi"];
  const beltLevels: BeltLevel[] = ["White", "Blue", "Purple", "Brown", "Black"];
  const competitions = DEFAULT_PRESETS.competitions;

  const getBeltColor = (belt: BeltLevel) => {
    const colors: Record<BeltLevel, string> = {
      White: "bg-white/20 text-white ring-white/50",
      Blue: "bg-blue-600/20 text-blue-400 ring-blue-500/50",
      Purple: "bg-purple-600/20 text-purple-400 ring-purple-500/50",
      Brown: "bg-amber-700/20 text-amber-600 ring-amber-600/50",
      Black: "bg-zinc-800/40 text-zinc-300 ring-zinc-500/50",
    };

    return colors[belt];
  };

  const handleSave = () => {
    onMetadataChange(editingMetadata);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingMetadata(metadata);
    setCustomCompetition("");
    setIsEditing(false);
  };

  const handleCompetitionSelect = (competition: string) => {
    if (competition === "Other") {
      setEditingMetadata((prev) => ({
        ...prev,
        competition: customCompetition || "Other",
      }));
      return;
    }

    setEditingMetadata((prev) => ({ ...prev, competition }));
    setCustomCompetition("");
  };

  if (!isEditing) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 animate-lift-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Match Type:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  metadata.matchType === "Gi"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {metadata.matchType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Belt:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getBeltColor(metadata.belt)}`}
              >
                {metadata.belt}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Event:</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
                {metadata.competition}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Match Type</span>
        <div className="flex gap-2">
          {matchTypes.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() =>
                setEditingMetadata((prev) => ({ ...prev, matchType: type }))
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                editingMetadata.matchType === type
                  ? type === "Gi"
                    ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50"
                    : "bg-orange-500/20 text-orange-400 ring-2 ring-orange-500/50"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Belt Level</span>
        <div className="flex gap-2 flex-wrap">
          {beltLevels.map((belt) => (
            <button
              type="button"
              key={belt}
              onClick={() => setEditingMetadata((prev) => ({ ...prev, belt }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                editingMetadata.belt === belt
                  ? `${getBeltColor(belt)} ring-2`
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {belt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">
          Event / Competition
        </span>
        <div className="flex gap-2 flex-wrap">
          {competitions.map((competition) => (
            <button
              type="button"
              key={competition}
              onClick={() => handleCompetitionSelect(competition)}
              className={`preset-btn text-sm ${
                editingMetadata.competition === competition ||
                (competition === "Other" &&
                  !competitions.includes(
                    editingMetadata.competition as CompetitionPreset,
                  ))
                  ? "active"
                  : ""
              }`}
            >
              {competition}
            </button>
          ))}
        </div>

        {(editingMetadata.competition === "Other" ||
          !competitions.includes(
            editingMetadata.competition as CompetitionPreset,
          )) && (
          <Input
            placeholder="Enter custom event name..."
            value={
              !competitions.includes(
                editingMetadata.competition as CompetitionPreset,
              ) && editingMetadata.competition !== "Other"
                ? editingMetadata.competition
                : customCompetition
            }
            onChange={(event) => {
              setCustomCompetition(event.target.value);
              setEditingMetadata((prev) => ({
                ...prev,
                competition: event.target.value || "Other",
              }));
            }}
            className="mt-2 bg-secondary border-border text-foreground max-w-xs"
          />
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90"
        >
          <Check className="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}
