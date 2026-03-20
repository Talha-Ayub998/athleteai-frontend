import { Edit, Loader2, Trash2 } from "lucide-react";
import { EVENT_TYPE_BADGE_VARIANTS, FightEvent } from "../types/events";
import { Button } from "./ui/Button";

interface EventTableProps {
  events: FightEvent[];
  onEditEvent: (event: FightEvent) => void;
  onDeleteEvent: (eventId: string) => Promise<void> | void;
  deletingEventId?: string | null;
  canEditEvents?: boolean;
  canDeleteEvents?: boolean;
  onSeekToEvent: (timestamp: number) => void;
  formatTime: (seconds: number) => string;
  emptyMessage?: string;
}

export function EventTable({
  events,
  onEditEvent,
  onDeleteEvent,
  deletingEventId,
  canEditEvents = true,
  canDeleteEvents = true,
  onSeekToEvent,
  formatTime,
  emptyMessage,
}: EventTableProps) {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const getPlayerBadgeClass = (player: string) => {
    switch (player) {
      case "Me":
        return "player-badge me";
      case "Opponent":
        return "player-badge opponent";
      case "AI Coach":
        return "player-badge coach";
      default:
        return "player-badge";
    }
  };

  const getTypeBadgeClass = (type: string) => {
    const badgeVariant =
      EVENT_TYPE_BADGE_VARIANTS[type as keyof typeof EVENT_TYPE_BADGE_VARIANTS];

    if (!badgeVariant) {
      return "type-badge";
    }

    return `type-badge ${badgeVariant}`;
  };

  const getOutcomeBadgeClass = (outcome?: FightEvent["outcome"]) => {
    switch (outcome) {
      case "success":
        return "result-badge win";
      case "failed":
        return "result-badge loss";
      default:
        return "result-badge";
    }
  };

  if (events.length === 0) {
    return (
      <div className="bg-card rounded-lg p-8 text-center border border-border">
        <p className="text-muted-foreground">
          {emptyMessage ||
            'No events found for this session yet. Pause the video and click "Add Event" to start annotating.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="event-table">
          <thead>
            <tr>
              <th className="w-20">Time</th>
              <th className="w-24">Player</th>
              <th className="w-40">Event Type</th>
              <th className="w-40">Move Name</th>
              <th className="w-24">Outcome</th>
              <th>Notes</th>
              <th className="w-20 text-center">Points</th>
              <th className="w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event, index) => (
              <tr
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td>
                  <button
                    type="button"
                    onClick={() => onSeekToEvent(event.timestamp)}
                    className="timestamp-badge hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                  >
                    {formatTime(event.timestamp)}
                  </button>
                </td>
                <td>
                  <span className={getPlayerBadgeClass(event.player)}>
                    {event.player}
                  </span>
                </td>
                <td>
                  <span className={getTypeBadgeClass(event.type)}>
                    {event.type}
                  </span>
                </td>
                <td className="font-medium text-white">{event.moveName}</td>
                <td>
                  <span className={getOutcomeBadgeClass(event.outcome)}>
                    {event.outcome === "failed"
                      ? "Failed"
                      : event.outcome === "success"
                        ? "Success"
                        : "-"}
                  </span>
                </td>
                <td className="text-muted-foreground max-w-xs">
                  <span className="line-clamp-3">{event.notes || "-"}</span>
                </td>
                <td className="text-center font-semibold text-white">
                  {event.points ?? "-"}
                </td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    {canEditEvents ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditEvent(event)}
                        className="action-btn edit h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    ) : (
                      <></>
                    )}
                    {canDeleteEvents ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void onDeleteEvent(event.id)}
                        disabled={deletingEventId === event.id}
                        className="action-btn delete h-8 w-8"
                      >
                        {deletingEventId === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    ) : (
                      // Temporarily hide event deletion once a result is declared.
                      // We may restore this action later if completed matches become editable again.
                      <></>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
