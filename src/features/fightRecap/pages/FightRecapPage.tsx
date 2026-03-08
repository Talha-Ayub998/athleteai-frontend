import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, FileVideo, BarChart3, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { VideoPlayer } from "../components/VideoPlayer";
import { EventTable } from "../components/EventTable";
import { AddEventModal } from "../components/AddEventModal";
import { MatchMetadataBar } from "../components/MatchMetadataBar";
import { ToolSidebar } from "../components/ToolSidebar";
import { FightEvent, MatchMetadata } from "../types/events";
import { Button } from "../components/ui/Button";
import { useFightRecapVideos } from "../context/FightRecapVideosContext";

const FightRecapPage = () => {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<FightEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [editingEvent, setEditingEvent] = useState<FightEvent | null>(null);
  const { videos, isLoading, fetchError, fetchVideos } = useFightRecapVideos();
  const [matchMetadata, setMatchMetadata] = useState<MatchMetadata>({
    matchType: "Gi",
    belt: "Blue",
    competition: "IBJJF",
  });
  const videoId = Number(id);
  const hasValidVideoId = Number.isInteger(videoId) && videoId > 0;

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleAddEvent = (timestamp: number) => {
    setCurrentTimestamp(timestamp);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<FightEvent, "id">) => {
    if (editingEvent) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEvent.id
            ? { ...eventData, id: editingEvent.id }
            : event,
        ),
      );
    } else {
      const newEvent: FightEvent = {
        ...eventData,
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    setEditingEvent(null);
  };

  const handleEditEvent = (event: FightEvent) => {
    setEditingEvent(event);
    setCurrentTimestamp(event.timestamp);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  const handleSeekToEvent = (timestamp: number) => {
    setCurrentTimestamp(timestamp);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTimestamp(time);
  };

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const selectedVideo = useMemo(() => {
    if (!hasValidVideoId) return null;
    return videos.find((video) => video.id === videoId) || null;
  }, [videos, videoId, hasValidVideoId]);

  return (
    <div className="fight-recap-screen min-h-screen bg-background flex">
      <ToolSidebar onAddEvent={() => handleAddEvent(currentTimestamp)} />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FileVideo className="w-7 h-7 text-primary" />
                BJJ Fight Analysis
              </h1>
              <p className="text-muted-foreground mt-1">
                Annotate and analyze your matches
              </p>
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {events.length} event{events.length !== 1 ? "s" : ""} recorded
            </span>
          </div>

          {isLoading && (
            <div className="bg-card rounded-lg border border-border p-8 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading video...
            </div>
          )}

          {!isLoading && fetchError && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Could not load video</p>
                  <p className="text-sm mt-1">{fetchError}</p>
                  <Button
                    onClick={() => void fetchVideos(true)}
                    variant="outline"
                    className="mt-4 text-foreground"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !fetchError && !selectedVideo && (
            <div className="bg-card rounded-lg border border-border p-10 text-center">
              <FileVideo className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground">
                Video not found
              </h2>
              <p className="text-muted-foreground mt-2">
                The requested video does not exist or is not available.
              </p>
            </div>
          )}

          {!isLoading && !fetchError && selectedVideo && (
            <>
              <MatchMetadataBar
                metadata={matchMetadata}
                onMetadataChange={setMatchMetadata}
              />

              <VideoPlayer
                src={selectedVideo.playback_url || selectedVideo.url}
                onAddEvent={handleAddEvent}
                onTimeUpdate={handleTimeUpdate}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Event Timeline
                  </h2>
                  <Button
                    onClick={() => handleAddEvent(currentTimestamp)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </Button>
                </div>

                <EventTable
                  events={events}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onSeekToEvent={handleSeekToEvent}
                  formatTime={formatTime}
                />
              </div>

              {events.length > 0 && (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Insights
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Match insights and analytics will appear here as you add
                    more events.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        timestamp={currentTimestamp}
        formatTime={formatTime}
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default FightRecapPage;
