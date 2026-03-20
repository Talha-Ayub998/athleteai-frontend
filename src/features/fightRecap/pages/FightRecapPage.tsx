import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Plus,
  FileVideo,
  Loader2,
  Trophy,
  CheckCircle2,
  Trash2,
  Download,
  RotateCcw,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { Modal } from "../../../components/ui/modal";
import { VideoPlayer } from "../components/VideoPlayer";
import { EventTable } from "../components/EventTable";
import { MatchResultsTable } from "../components/MatchResultsTable";
import { AddEventModal } from "../components/AddEventModal";
import {
  DeclareResultModal,
  DeclareMatchResultPayload,
} from "../components/DeclareResultModal";
import {
  FinalizeReportModal,
  FinalizeReportPayload,
  FinalizeReportSubmitResult,
} from "../components/FinalizeReportModal";
import {
  EVENT_TYPES,
  EventType,
  FightEvent,
  MatchResult,
  PlayerType,
} from "../types/events";
import { Button } from "../components/ui/Button";
import { useFightRecapVideos } from "../context/FightRecapVideosContext";

interface ErrorWithResponseData {
  response?: {
    data?: {
      message?: string;
      detail?: string;
      error?: string;
      errors?: string | string[];
    };
  };
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const normalizedError = error as ErrorWithResponseData;
  return (
    normalizedError?.response?.data?.message ||
    normalizedError?.response?.data?.detail ||
    normalizedError?.response?.data?.error ||
    normalizedError?.message ||
    fallback
  );
};

const getFinalizeErrorMessage = (error: unknown, fallback: string) => {
  const normalizedError = error as ErrorWithResponseData;
  const responseData = normalizedError?.response?.data;

  if (Array.isArray(responseData?.errors)) {
    return responseData.errors.join("\n");
  }

  if (typeof responseData?.errors === "string" && responseData.errors.trim()) {
    return responseData.errors;
  }

  return (
    responseData?.message ||
    responseData?.error ||
    normalizedError?.message ||
    fallback
  );
};

interface AnnotationSessionEventResponse {
  id: number;
  session: number;
  match_number: number;
  timestamp_seconds: number;
  player: string;
  event_type: string;
  move_name: string;
  outcome: "success" | "failed";
  note: string | null;
  points?: number | null;
}

interface AnnotationSessionDetailsResponse {
  session: {
    id: number;
    title: string | null;
  };
  events: AnnotationSessionEventResponse[];
  match_results: AnnotationSessionMatchResultResponse[];
}

interface AnnotationSessionMatchResultResponse {
  id: number;
  session: number;
  match_number: number;
  result: string;
  match_type: string;
  referee_decision: boolean;
  disqualified: boolean;
  opponent: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CreateSessionEventPayload {
  match_number: number;
  timestamp_seconds: number;
  player: "me" | "opponent" | "ai_coach";
  event_type: string;
  move_name: string;
  outcome: "success" | "failed";
  note: string;
}

interface FinalizeReportResponse {
  status: string;
  message: string;
  session_id: number;
  report_id: number;
  s3_key: string;
  s3_url: string;
  match_count: number;
  credit_source: string;
}

interface DownloadXlsxResponse {
  status: string;
  session_id: number;
  report_id: number;
  filename: string;
  s3_key: string;
  download_url: string;
  expires_in_seconds: number;
}

interface ReopenAnnotationResponse {
  status: "success" | "already_draft" | string;
  message: string;
  session_id: number;
  deleted_report_id?: number | null;
  deleted_s3_key?: string | null;
  s3_results?: Array<{
    key: string;
    status: string;
  }>;
}

const normalizeMatchNumber = (value: number | null | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.floor(value);
};

const mapPlayerToUi = (player: string): PlayerType => {
  const normalized = player.trim().toLowerCase();
  if (normalized === "opponent") return "Opponent";
  if (
    normalized === "ai coach" ||
    normalized === "ai_coach" ||
    normalized === "coach"
  ) {
    return "AI Coach";
  }
  return "Me";
};

const mapEventTypeToUi = (eventType: string): EventType => {
  const normalized = eventType.trim().toLowerCase();
  const matchingEventType = EVENT_TYPES.find(
    (value) => value.toLowerCase() === normalized,
  );

  if (matchingEventType) {
    return matchingEventType;
  }

  if (normalized === "position") return "Neutral Position";
  if (normalized === "transition") return "Takedown";
  if (normalized === "submission") return "Submission";

  return EVENT_TYPES[0];
};

const mapApiEventToFightEvent = (
  apiEvent: AnnotationSessionEventResponse,
): FightEvent => {
  return {
    id: String(apiEvent.id),
    timestamp: Number(apiEvent.timestamp_seconds) || 0,
    player: mapPlayerToUi(apiEvent.player || ""),
    type: mapEventTypeToUi(apiEvent.event_type || ""),
    moveName: apiEvent.move_name || "Unknown",
    notes: apiEvent.note || "",
    points: apiEvent.points ?? undefined,
    matchNumber: normalizeMatchNumber(apiEvent.match_number),
    outcome: apiEvent.outcome || "success",
  };
};

const mapApiMatchResultToMatchResult = (
  apiMatchResult: AnnotationSessionMatchResultResponse,
): MatchResult => {
  return {
    id: String(apiMatchResult.id),
    matchNumber: normalizeMatchNumber(apiMatchResult.match_number),
    result: apiMatchResult.result || "Unknown",
    matchType: apiMatchResult.match_type || "",
    opponent: apiMatchResult.opponent || "",
    refereeDecision: Boolean(apiMatchResult.referee_decision),
    disqualified: Boolean(apiMatchResult.disqualified),
    createdAt: apiMatchResult.created_at ?? null,
    updatedAt: apiMatchResult.updated_at ?? null,
  };
};

const mapPlayerToApi = (player: PlayerType): "me" | "opponent" | "ai_coach" => {
  if (player === "Opponent") return "opponent";
  if (player === "AI Coach") return "ai_coach";
  return "me";
};

const mapEventTypeToApi = (eventType: EventType): string =>
  eventType.toLowerCase();

const FightRecapPage = () => {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<FightEvent[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeclareResultModalOpen, setIsDeclareResultModalOpen] =
    useState(false);
  const [isFinalizeReportModalOpen, setIsFinalizeReportModalOpen] =
    useState(false);
  const [isReopenAnnotationModalOpen, setIsReopenAnnotationModalOpen] =
    useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [modalMatchNumber, setModalMatchNumber] = useState(1);
  const [resultMatchNumber, setResultMatchNumber] = useState(1);
  const [expandedMatchNumbers, setExpandedMatchNumbers] = useState<number[]>(
    [],
  );
  const [manualMatchNumbers, setManualMatchNumbers] = useState<number[]>([]);
  const [editingEvent, setEditingEvent] = useState<FightEvent | null>(null);
  const [editingMatchResult, setEditingMatchResult] =
    useState<MatchResult | null>(null);
  const [isSessionFinalized, setIsSessionFinalized] = useState(false);
  const [isDownloadingXlsx, setIsDownloadingXlsx] = useState(false);
  const [isReopeningAnnotation, setIsReopeningAnnotation] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<FightEvent | null>(null);
  const {
    videos,
    isLoading,
    fetchError,
    fetchVideos,
    createSessionForVideo,
    updateVideo,
  } = useFightRecapVideos();
  const [isSessionPreparing, setIsSessionPreparing] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const videoId = Number(id);
  const hasValidVideoId = Number.isInteger(videoId) && videoId > 0;

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleAddEvent = (timestamp: number, matchNumber: number) => {
    setCurrentTimestamp(timestamp);
    setModalMatchNumber(normalizeMatchNumber(matchNumber));
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenDeclareResultModal = (
    matchNumber: number,
    matchResult: MatchResult | null = null,
  ) => {
    setResultMatchNumber(normalizeMatchNumber(matchNumber));
    setEditingMatchResult(matchResult);
    setIsDeclareResultModalOpen(true);
  };

  const handleCloseDeclareResultModal = () => {
    setIsDeclareResultModalOpen(false);
    setEditingMatchResult(null);
  };

  const handleOpenFinalizeReportModal = () => {
    setIsFinalizeReportModalOpen(true);
  };

  const handleCloseFinalizeReportModal = () => {
    setIsFinalizeReportModalOpen(false);
  };

  const handleOpenReopenAnnotationModal = () => {
    setIsReopenAnnotationModalOpen(true);
  };

  const handleCloseReopenAnnotationModal = () => {
    if (isReopeningAnnotation) return;
    setIsReopenAnnotationModalOpen(false);
  };

  const handleToggleMatchSection = (matchNumber: number) => {
    const normalizedMatchNumber = normalizeMatchNumber(matchNumber);
    setExpandedMatchNumbers((prev) => {
      if (prev.includes(normalizedMatchNumber)) {
        return prev.filter((item) => item !== normalizedMatchNumber);
      }
      return [...prev, normalizedMatchNumber];
    });
  };

  const handleOpenMatchSection = (matchNumber: number) => {
    const normalizedMatchNumber = normalizeMatchNumber(matchNumber);
    setExpandedMatchNumbers((prev) =>
      prev.includes(normalizedMatchNumber)
        ? prev
        : [...prev, normalizedMatchNumber],
    );
  };

  const handleAddMatch = () => {
    setManualMatchNumbers((prev) => {
      if (prev.includes(currentMatchNumber)) {
        return prev;
      }
      return [...prev, currentMatchNumber];
    });
    handleOpenMatchSection(currentMatchNumber);
  };

  const handleDeleteEmptyMatch = (matchNumber: number) => {
    const normalizedMatchNumber = normalizeMatchNumber(matchNumber);
    setManualMatchNumbers((prev) =>
      prev.filter((item) => item !== normalizedMatchNumber),
    );
    setExpandedMatchNumbers((prev) =>
      prev.filter((item) => item !== normalizedMatchNumber),
    );
  };

  const handleFinalizeReport = async (
    payload: FinalizeReportPayload,
  ): Promise<FinalizeReportSubmitResult> => {
    if (!selectedVideo?.session_id) {
      return {
        success: false,
        errorMessage: "Finalize report failed. Video session not ready.",
      };
    }

    try {
      const response = await axiosInstance.post<FinalizeReportResponse>(
        `/reports/annotation-sessions/${selectedVideo.session_id}/finalize/`,
        payload,
      );

      setIsSessionFinalized(true);
      updateVideo(selectedVideo.id, { session_status: "completed" });
      toast.success(
        response.data?.message || "Annotation session finalized successfully.",
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errorMessage: getFinalizeErrorMessage(error, "Finalize report failed."),
      };
    }
  };

  const handleDownloadXlsx = async () => {
    if (!selectedVideo?.session_id) {
      toast.error("Failed to fetch XLSX file.");
      return;
    }

    setIsDownloadingXlsx(true);
    try {
      const response = await axiosInstance.get<DownloadXlsxResponse>(
        `/reports/annotation-sessions/${selectedVideo.session_id}/download-xlsx/`,
      );

      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) {
        toast.error("Failed to fetch XLSX file.");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = response.data?.filename || "report.xlsx";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch XLSX file."));
    } finally {
      setIsDownloadingXlsx(false);
    }
  };

  const handleReopenAnnotation = async () => {
    if (!selectedVideo?.session_id) {
      toast.error("Reopen annotation failed. Video session not ready.");
      return;
    }

    setIsReopeningAnnotation(true);
    try {
      const response = await axiosInstance.post<ReopenAnnotationResponse>(
        `/reports/annotation-sessions/${selectedVideo.session_id}/reopen/`,
      );

      const responseStatus = response.data?.status?.trim().toLowerCase();
      const isAlreadyDraft = responseStatus === "already_draft";

      updateVideo(selectedVideo.id, { session_status: "draft" });
      setIsSessionFinalized(false);
      setIsReopenAnnotationModalOpen(false);

      if (isAlreadyDraft) {
        toast.success(
          response.data?.message || "Session is already in draft state.",
        );
        return;
      }

      toast.success(
        response.data?.message ||
          "Annotation reopened successfully. Editing is enabled again.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Reopen annotation failed."));
    } finally {
      setIsReopeningAnnotation(false);
    }
  };

  const handleDeclareResult = async (
    payload: DeclareMatchResultPayload,
  ): Promise<boolean> => {
    if (!selectedVideo?.session_id) {
      toast.error("Declare result failed. Video session not ready.");
      return false;
    }

    try {
      let response;
      if (editingMatchResult) {
        const editingMatchResultId = Number(editingMatchResult.id);
        if (!Number.isFinite(editingMatchResultId)) {
          toast.error("Update result failed.");
          return false;
        }

        response =
          await axiosInstance.patch<AnnotationSessionMatchResultResponse>(
            `/reports/annotation-sessions/${selectedVideo.session_id}/match-results/${editingMatchResultId}/`,
            payload,
          );
      } else {
        response =
          await axiosInstance.post<AnnotationSessionMatchResultResponse>(
            `/reports/annotation-sessions/${selectedVideo.session_id}/match-results/`,
            payload,
          );
      }

      const newMatchResult = mapApiMatchResultToMatchResult(response.data);
      setMatchResults((prev) => {
        const withoutDuplicate = prev.filter(
          (result) =>
            result.id !== newMatchResult.id &&
            normalizeMatchNumber(result.matchNumber) !==
              normalizeMatchNumber(newMatchResult.matchNumber),
        );
        return [...withoutDuplicate, newMatchResult];
      });

      setEditingMatchResult(null);
      toast.success(
        editingMatchResult
          ? `Result updated for Match ${payload.match_number}.`
          : `Result declared for Match ${payload.match_number}.`,
      );
      return true;
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          editingMatchResult
            ? "Update result failed."
            : "Declare result failed.",
        ),
      );
      return false;
    }
  };

  const handleSaveEvent = async (
    eventData: Omit<FightEvent, "id">,
  ): Promise<boolean> => {
    if (!selectedVideo) {
      toast.error("Add event failed. Video session not ready.");
      return false;
    }

    if (!Number.isFinite(eventData.timestamp) || eventData.timestamp < 0) {
      toast.error("Timestamp must be 0 or greater.");
      return false;
    }

    if (videoDuration > 0 && eventData.timestamp > videoDuration) {
      toast.error(
        `Timestamp cannot be greater than ${formatTime(videoDuration)}.`,
      );
      return false;
    }

    try {
      const sessionId =
        selectedVideo.session_id ??
        (await createSessionForVideo(selectedVideo.id));

      const payload: CreateSessionEventPayload = {
        match_number: normalizeMatchNumber(eventData.matchNumber),
        timestamp_seconds: Number(eventData.timestamp.toFixed(2)),
        player: mapPlayerToApi(eventData.player),
        event_type: mapEventTypeToApi(eventData.type),
        move_name: eventData.moveName,
        outcome: eventData.outcome || "success",
        note: eventData.notes || "",
      };

      if (editingEvent) {
        const editingEventId = Number(editingEvent.id);
        if (!Number.isFinite(editingEventId)) {
          toast.error("Add event failed.");
          return false;
        }

        const response =
          await axiosInstance.patch<AnnotationSessionEventResponse>(
            `/reports/annotation-sessions/${sessionId}/events/${editingEventId}/`,
            payload,
          );

        const updatedEvent = mapApiEventToFightEvent(response.data);
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEvent.id ? updatedEvent : event,
          ),
        );
        setEditingEvent(null);
        return true;
      }

      const response = await axiosInstance.post<AnnotationSessionEventResponse>(
        `/reports/annotation-sessions/${sessionId}/events/`,
        payload,
      );

      const newEvent = mapApiEventToFightEvent(response.data);
      setEvents((prev) => {
        const withoutDuplicate = prev.filter(
          (event) => event.id !== newEvent.id,
        );
        return [...withoutDuplicate, newEvent];
      });
      setEditingEvent(null);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Add event failed."));
      return false;
    }
  };

  const handleEditEvent = (event: FightEvent) => {
    setEditingEvent(event);
    setCurrentTimestamp(event.timestamp);
    setModalMatchNumber(normalizeMatchNumber(event.matchNumber));
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const targetEvent = events.find((event) => event.id === eventId);
    if (!targetEvent) return;
    setEventToDelete(targetEvent);
  };

  const closeDeleteModal = () => {
    if (deletingEventId) return;
    setEventToDelete(null);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const sessionId = selectedVideo?.session_id;
    if (sessionId === null || sessionId === undefined) {
      toast.error("Delete failed. Video session not ready.");
      return;
    }

    const parsedEventId = Number(eventToDelete.id);
    if (!Number.isFinite(parsedEventId)) {
      toast.error("Delete failed.");
      return;
    }

    setDeletingEventId(eventToDelete.id);
    try {
      await axiosInstance.delete(
        `/reports/annotation-sessions/${sessionId}/events/${parsedEventId}/`,
      );
      setEvents((prev) =>
        prev.filter((event) => event.id !== eventToDelete.id),
      );
      setEventToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete event."));
    } finally {
      setDeletingEventId(null);
    }
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

  useEffect(() => {
    setManualMatchNumbers([]);
    setExpandedMatchNumbers([]);
    setIsSessionFinalized(false);
    setIsDownloadingXlsx(false);
    setVideoDuration(0);
  }, [selectedVideo?.id]);

  useEffect(() => {
    setIsSessionFinalized(
      selectedVideo?.session_status?.trim().toLowerCase() === "completed",
    );
  }, [selectedVideo?.session_status]);

  useEffect(() => {
    if (isLoading || !selectedVideo) return;
    const hasSession =
      selectedVideo.session_id !== null &&
      selectedVideo.session_id !== undefined;
    if (hasSession) {
      setSessionError("");
      return;
    }

    let isCancelled = false;

    const ensureSession = async () => {
      setIsSessionPreparing(true);
      setSessionError("");
      try {
        await createSessionForVideo(selectedVideo.id);
        if (isCancelled) return;
      } catch (error) {
        if (isCancelled) return;
        setSessionError(
          getErrorMessage(
            error,
            "Failed to prepare annotation session. Please try again.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsSessionPreparing(false);
        }
      }
    };

    void ensureSession();

    return () => {
      isCancelled = true;
    };
  }, [isLoading, selectedVideo, createSessionForVideo]);

  useEffect(() => {
    if (isLoading || isSessionPreparing || !selectedVideo?.session_id) return;

    let isCancelled = false;

    const fetchSessionEvents = async () => {
      setIsEventsLoading(true);
      setSessionError("");
      try {
        const response =
          await axiosInstance.get<AnnotationSessionDetailsResponse>(
            `/reports/annotation-sessions/${selectedVideo.session_id}/`,
          );
        if (isCancelled) return;

        const mappedEvents = Array.isArray(response.data?.events)
          ? response.data.events.map(mapApiEventToFightEvent)
          : [];
        const mappedMatchResults = Array.isArray(response.data?.match_results)
          ? response.data.match_results.map(mapApiMatchResultToMatchResult)
          : [];
        setEvents(mappedEvents);
        setMatchResults(mappedMatchResults);
      } catch (error) {
        if (isCancelled) return;
        setEvents([]);
        setMatchResults([]);
        setSessionError(
          getErrorMessage(error, "Failed to fetch session events."),
        );
      } finally {
        if (!isCancelled) {
          setIsEventsLoading(false);
        }
      }
    };

    void fetchSessionEvents();

    return () => {
      isCancelled = true;
    };
  }, [
    isLoading,
    isSessionPreparing,
    selectedVideo?.id,
    selectedVideo?.session_id,
  ]);

  const { currentMatchNumber, matchSections, areAllMatchesDeclared } =
    useMemo(() => {
      const latestResultByMatchNumber = new Map<number, MatchResult>();
      const sortedResults = [...matchResults].sort(
        (a, b) => Number(a.id) - Number(b.id),
      );
      sortedResults.forEach((result) => {
        latestResultByMatchNumber.set(
          normalizeMatchNumber(result.matchNumber),
          result,
        );
      });

      const knownMatchNumbers = new Set<number>();

      events.forEach((event) => {
        knownMatchNumbers.add(normalizeMatchNumber(event.matchNumber));
      });
      matchResults.forEach((result) => {
        knownMatchNumbers.add(normalizeMatchNumber(result.matchNumber));
      });
      manualMatchNumbers.forEach((matchNumber) => {
        knownMatchNumbers.add(normalizeMatchNumber(matchNumber));
      });

      const sortedMatchNumbers = Array.from(knownMatchNumbers).sort(
        (a, b) => a - b,
      );
      const openMatchNumbers = sortedMatchNumbers.filter(
        (matchNumber) => !latestResultByMatchNumber.has(matchNumber),
      );
      const highestKnownMatchNumber =
        sortedMatchNumbers[sortedMatchNumbers.length - 1] ?? 0;
      const derivedCurrentMatchNumber =
        openMatchNumbers[openMatchNumbers.length - 1] ??
        Math.max(highestKnownMatchNumber + 1, 1);

      const sections = sortedMatchNumbers.map((matchNumber) => ({
        matchNumber,
        events: events.filter(
          (event) => normalizeMatchNumber(event.matchNumber) === matchNumber,
        ),
        result: latestResultByMatchNumber.get(matchNumber) ?? null,
        isManualMatch: manualMatchNumbers.includes(matchNumber),
        isCurrentMatch:
          openMatchNumbers.length > 0 &&
          matchNumber === derivedCurrentMatchNumber,
      }));

      return {
        currentMatchNumber: derivedCurrentMatchNumber,
        matchSections: sections,
        areAllMatchesDeclared:
          sortedMatchNumbers.length > 0 && openMatchNumbers.length === 0,
      };
    }, [events, matchResults, manualMatchNumbers]);

  useEffect(() => {
    setExpandedMatchNumbers((prev) =>
      prev.includes(currentMatchNumber) ? prev : [...prev, currentMatchNumber],
    );
  }, [currentMatchNumber]);

  const orderedMatchSections = useMemo(
    () => [...matchSections].sort((a, b) => b.matchNumber - a.matchNumber),
    [matchSections],
  );

  const isPageLoading = isLoading || isSessionPreparing || isEventsLoading;
  const isCompletedSession =
    isSessionFinalized ||
    selectedVideo?.session_status?.trim().toLowerCase() === "completed";
  const canAddMatch =
    !isCompletedSession &&
    (matchSections.length === 0 || areAllMatchesDeclared);
  const canFinalizeReport = !isCompletedSession && areAllMatchesDeclared;

  return (
    <div className="fight-recap-screen min-h-screen bg-background flex ">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          },
          success: {
            iconTheme: {
              primary: "hsl(var(--success))",
              secondary: "hsl(var(--foreground))",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "hsl(var(--foreground))",
            },
          },
        }}
        containerStyle={{ top: 16 }}
      />
      {/* <ToolSidebar
        onAddEvent={() => handleAddEvent(currentTimestamp, currentMatchNumber)}
        canAddEvent={!isCompletedSession}
      /> */}

      <main className="flex-1 overflow-y-auto px-4 py-5 animate-lift-in sm:p-6">
        <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:gap-3 sm:text-2xl">
                <FileVideo className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                BJJ Fight Analysis
              </h1>
              <p className="text-muted-foreground mt-1">
                Annotate and analyze your matches
              </p>
            </div>
            {/* <span className="text-sm text-muted-foreground whitespace-nowrap">
              Total events recorded: {events.length}
            </span> */}
          </div>

          {isPageLoading && (
            <div className="bg-card rounded-lg border border-border p-6 text-muted-foreground sm:p-8">
              <div className="flex items-center justify-center gap-3 text-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading video...
              </div>
            </div>
          )}

          {!isPageLoading && fetchError && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Could not load video</p>
                  <p className="text-sm mt-1">{fetchError}</p>
                  <Button
                    onClick={() => void fetchVideos(true)}
                    variant="outline"
                    className="mt-4 w-full text-foreground sm:w-auto"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isPageLoading && !fetchError && sessionError && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Could not prepare session</p>
                  <p className="text-sm mt-1">{sessionError}</p>
                  <Button
                    onClick={() => {
                      setSessionError("");
                      void fetchVideos(true);
                    }}
                    variant="outline"
                    className="mt-4 w-full text-foreground sm:w-auto"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isPageLoading && !fetchError && !sessionError && !selectedVideo && (
            <div className="bg-card rounded-lg border border-border p-6 text-center sm:p-10">
              <FileVideo className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground">
                Video not found
              </h2>
              <p className="text-muted-foreground mt-2">
                The requested video does not exist or is not available.
              </p>
            </div>
          )}

          {!isPageLoading && !fetchError && !sessionError && selectedVideo && (
            <>
              <VideoPlayer
                key={selectedVideo.id}
                src={selectedVideo.playback_url || selectedVideo.url}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={setVideoDuration}
                pauseWhenModalOpen={
                  isModalOpen ||
                  isDeclareResultModalOpen ||
                  isFinalizeReportModalOpen ||
                  isReopenAnnotationModalOpen
                }
              />

              <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Video
                  </p>
                  <h2 className="text-lg font-semibold text-foreground [overflow-wrap:anywhere]">
                    {selectedVideo.file_name || "Untitled video"}
                  </h2>
                </div>

                {isCompletedSession ? (
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenReopenAnnotationModal}
                      disabled={isReopeningAnnotation}
                      className="w-full gap-2 border-border text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {isReopeningAnnotation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reopening...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Reopen Annotation
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleDownloadXlsx()}
                      disabled={isDownloadingXlsx}
                      className="w-full gap-2 border-border text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {isDownloadingXlsx ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download XLSX
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <Button
                      onClick={handleAddMatch}
                      disabled={!canAddMatch}
                      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Match
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenFinalizeReportModal}
                      disabled={!canFinalizeReport}
                      className="w-full gap-2 border-border text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Finalize Report
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {orderedMatchSections.map((section) => {
                  const isExpanded = expandedMatchNumbers.includes(
                    section.matchNumber,
                  );
                  const canAddEvent = section.isCurrentMatch && !section.result;
                  const canDeleteEmptyMatch =
                    section.isManualMatch &&
                    section.events.length === 0 &&
                    !section.result;

                  return (
                    <section
                      key={section.matchNumber}
                      className="bg-card rounded-lg border border-border p-4 sm:p-5"
                    >
                      <div
                        className="flex cursor-pointer flex-col gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                        onClick={() =>
                          handleToggleMatchSection(section.matchNumber)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleToggleMatchSection(section.matchNumber);
                          }
                        }}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? `Collapse match ${section.matchNumber}`
                            : `Expand match ${section.matchNumber}`
                        }
                      >
                        <div className="min-w-0 self-start">
                          <h2 className="text-lg font-semibold text-foreground">
                            Match {section.matchNumber}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {section.isCurrentMatch
                              ? "Current match"
                              : "Completed match"}
                          </p>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                          {!isCompletedSession && section.result && (
                            <Button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenMatchSection(section.matchNumber);
                                handleOpenDeclareResultModal(
                                  section.matchNumber,
                                  section.result,
                                );
                              }}
                              variant="outline"
                              className="w-full gap-2 border-border text-foreground hover:bg-secondary sm:w-auto"
                            >
                              <Trophy className="w-4 h-4" />
                              Edit Result
                            </Button>
                          )}
                          {canAddEvent && !isCompletedSession && (
                            <>
                              {section.events.length > 0 && (
                                <Button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenDeclareResultModal(
                                      section.matchNumber,
                                    );
                                  }}
                                  variant="outline"
                                  className="w-full gap-2 border-border text-foreground hover:bg-secondary sm:w-auto"
                                >
                                  <Trophy className="w-4 h-4" />
                                  Declare Result
                                </Button>
                              )}
                              <Button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddEvent(
                                    currentTimestamp,
                                    section.matchNumber,
                                  );
                                }}
                                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                              >
                                <Plus className="w-4 h-4" />
                                Add Event
                              </Button>
                              {canDeleteEmptyMatch && (
                                <Button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteEmptyMatch(section.matchNumber);
                                  }}
                                  type="button"
                                  variant="outline"
                                  className="w-full gap-2 text-red-500 hover:bg-red-500 hover:text-red-600 sm:w-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        className={`match-drawer-content ${
                          isExpanded ? "expanded" : ""
                        }`}
                        aria-hidden={!isExpanded}
                      >
                        <div className="match-drawer-inner space-y-4">
                          <EventTable
                            events={section.events}
                            onEditEvent={handleEditEvent}
                            onDeleteEvent={handleDeleteEvent}
                            deletingEventId={deletingEventId}
                            canEditEvents={!isCompletedSession}
                            canDeleteEvents={
                              !isCompletedSession && !section.result
                            }
                            onSeekToEvent={handleSeekToEvent}
                            formatTime={formatTime}
                            emptyMessage={`No events yet for Match ${section.matchNumber}.`}
                          />

                          <MatchResultsTable
                            matchNumber={section.matchNumber}
                            matchResult={section.result}
                          />
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* {events.length > 0 && (
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
              )} */}
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
        maxTimestamp={videoDuration}
        formatTime={formatTime}
        editingEvent={editingEvent}
        defaultMatchNumber={modalMatchNumber}
      />

      <DeclareResultModal
        isOpen={isDeclareResultModalOpen}
        onClose={handleCloseDeclareResultModal}
        matchNumber={resultMatchNumber}
        onSubmit={handleDeclareResult}
        editingResult={editingMatchResult}
      />

      <FinalizeReportModal
        isOpen={isFinalizeReportModalOpen}
        onClose={handleCloseFinalizeReportModal}
        initialFilename={selectedVideo?.file_name || ""}
        onSubmit={handleFinalizeReport}
      />

      <Modal
        className="mx-4 w-[calc(100%-2rem)] max-w-xl"
        isOpen={isReopenAnnotationModalOpen}
        onClose={handleCloseReopenAnnotationModal}
        showCloseButton={false}
      >
        <div className="p-4 sm:p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Reopen Annotation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Reopening this annotation will permanently delete the current
            generated report file. You will be able to edit matches and events
            again after reopening.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={handleCloseReopenAnnotationModal}
              variant="outline"
              disabled={isReopeningAnnotation}
              className="w-full text-gray-900 dark:text-white sm:w-auto"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => void handleReopenAnnotation()}
              disabled={isReopeningAnnotation}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {isReopeningAnnotation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reopening...
                </>
              ) : (
                "Yes, Reopen Annotation"
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        className="mx-4 w-[calc(100%-2rem)] max-w-xl"
        isOpen={Boolean(eventToDelete)}
        onClose={closeDeleteModal}
        showCloseButton={false}
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Event
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this event at{" "}
            <span className="font-medium">
              {eventToDelete ? formatTime(eventToDelete.timestamp) : ""}
            </span>
            ? This action cannot be undone.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={closeDeleteModal}
              variant="outline"
              disabled={Boolean(deletingEventId)}
              className="w-full text-gray-900 dark:text-white sm:w-auto"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteEvent()}
              disabled={!eventToDelete || Boolean(deletingEventId)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {deletingEventId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FightRecapPage;
