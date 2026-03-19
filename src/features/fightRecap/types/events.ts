export type PlayerType = "Me" | "Opponent" | "AI Coach";

export type EventType = "Position" | "Transition" | "Submission" | "Note";

export type MatchType = "Gi" | "No-Gi";

export type BeltLevel = "White" | "Blue" | "Purple" | "Brown" | "Black";

export type CompetitionPreset =
  | "IBJJF"
  | "ADCC"
  | "EBI"
  | "Grappling Industries"
  | "NAGA"
  | "Good Fight"
  | "F2W"
  | "WNO"
  | "In-House"
  | "Training";
// | 'Other';

export type PositionPreset =
  | "Closed Guard"
  | "Half Guard"
  | "Deep Half Guard"
  | "Butterfly Guard"
  | "De La Riva"
  | "Reverse De La Riva"
  | "Single Leg X"
  | "X Guard"
  | "50/50 Guard"
  | "Turtle"
  | "Side Control"
  | "Mount"
  | "Back"
  | "Knee on Belly"
  | "Front Head";
// | 'Other';

export type TransitionPreset =
  | "Guard Pull"
  | "Double Leg"
  | "Single Leg"
  | "Ankle Pick"
  | "Foot Sweep"
  | "Snapdown"
  | "Knee Tap"
  | "Body Lock Pass"
  | "Double Under Pass"
  | "Knee Cut"
  | "Leg Drag"
  | "X Pass"
  | "Scissor Sweep"
  | "Hip Bump Sweep"
  | "Half Guard Sweep"
  | "Berimbolo"
  | "Guard Pass"
  | "Over/Under Pass";
// | 'Other';

export type SubmissionPreset =
  | "Arm Bar"
  | "Triangle"
  | "RNC"
  | "Guillotine"
  | "Kimura"
  | "Americana"
  | "Heel Hook"
  | "Straight Ankle Lock"
  | "Arm Triangle"
  | "Darce"
  | "Cross Collar Choke"
  | "Bow and Arrow"
  | "Ezekiel"
  | "Omoplata"
  | "Knee Bar"
  | "Toe Hold";
// | 'Other';

export type NotePreset =
  | "Match Start"
  | "Match End"
  | "Coach Note"
  | "Observation";
// | 'Other';

export interface MatchMetadata {
  matchType: MatchType;
  belt: BeltLevel;
  competition: string;
}

export interface FightEvent {
  id: string;
  timestamp: number; // in seconds
  player: PlayerType;
  type: EventType;
  position: string;
  notes: string;
  points?: number;
  matchNumber?: number;
  outcome?: "success" | "failed";
}

export interface MatchResult {
  id: string;
  matchNumber: number;
  result: string;
  matchType: string;
  opponent: string;
  refereeDecision: boolean;
  disqualified: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventPresets {
  positions: PositionPreset[];
  transitions: TransitionPreset[];
  submissions: SubmissionPreset[];
  notes: NotePreset[];
  competitions: CompetitionPreset[];
}

export const DEFAULT_PRESETS: EventPresets = {
  positions: [
    "Closed Guard",
    "Half Guard",
    "Deep Half Guard",
    "Butterfly Guard",
    "De La Riva",
    "Reverse De La Riva",
    "Single Leg X",
    "X Guard",
    "50/50 Guard",
    "Turtle",
    "Side Control",
    "Mount",
    "Back",
    "Knee on Belly",
    "Front Head",
    // "Other",
  ],
  transitions: [
    "Guard Pull",
    "Double Leg",
    "Single Leg",
    "Ankle Pick",
    "Foot Sweep",
    "Snapdown",
    "Knee Tap",
    "Body Lock Pass",
    "Double Under Pass",
    "Knee Cut",
    "Leg Drag",
    "X Pass",
    "Scissor Sweep",
    "Hip Bump Sweep",
    "Half Guard Sweep",
    "Berimbolo",
    "Guard Pass",
    "Over/Under Pass",
    // 'Other',
  ],
  submissions: [
    "Arm Bar",
    "Triangle",
    "RNC",
    "Guillotine",
    "Kimura",
    "Americana",
    "Heel Hook",
    "Straight Ankle Lock",
    "Arm Triangle",
    "Darce",
    "Cross Collar Choke",
    "Bow and Arrow",
    "Ezekiel",
    "Omoplata",
    "Knee Bar",
    "Toe Hold",
    // 'Other',
  ],
  notes: [
    "Match Start",
    "Match End",
    "Coach Note",
    "Observation",
    // 'Other',
  ],
  competitions: [
    "IBJJF",
    "ADCC",
    "EBI",
    "Grappling Industries",
    "NAGA",
    "Good Fight",
    "F2W",
    "WNO",
    "In-House",
    "Training",
    // 'Other',
  ],
};
