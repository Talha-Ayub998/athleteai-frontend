export type PlayerType = "Me" | "Opponent" | "AI Coach";

export type MatchType = "Gi" | "No-Gi";

export type BeltLevel = "White" | "Blue" | "Purple" | "Brown" | "Black";

export const EVENT_TYPE_PRESETS = {
  "Neutral Position": [
    "50/50 Guard",
    "Closed Guard",
    "Dogfight Position",
    "Saddle",
  ],
  Submission: [
    "Abe Lock",
    "Americana",
    "Anaconda",
    "Aoki Lock",
    "Arm Bar",
    "Arm in RNC",
    "Arm Triangle",
    "Backside 50/50 Heel Hook",
    "Banana Split",
    "Baratoplata",
    "Baseball Choke",
    "Bow and Arrow",
    "Buggy Choke",
    "Calf Slicer",
    "Can Opener",
    "Canto Choke",
    "Choke",
    "Choi Bar",
    "Clock Choke",
    "Cross Collar Choke",
    "Crucifix RNC",
    "Darce",
    "Darce Grip Armbar",
    "Dead Orchard",
    "Estima Lock",
    "Ezekiel",
    "Flying Arm Bar",
    "Flying Triangle",
    "Front Collar Choke",
    "Gogoplata",
    "Guillotine",
    "Heel Hook",
    "Inside Heel Hook",
    "Inverted Triangle",
    "Japanese Necktie",
    "Kesa Gatame",
    "Kimura",
    "Knee Bar",
    "Knee Crush",
    "Lapel Choke (Back)",
    "Leg Lock Attack",
    "Loop Choke",
    "Mikey Lock",
    "Mir Lock",
    "Mothers Milk",
    "North/South Choke",
    "Omoplata",
    "Outside Heel Hook",
    "Paper Cutter",
    "Peruvian Necktie",
    "Punch Choke",
    "Reverse Triangle",
    "RNC",
    "Shoulder Lock",
    "Straight Ankle Lock",
    "Straight Arm Lock",
    "Sulaev Stretch",
    "Tarikoplata",
    "Teepee Choke",
    "Toe Hold",
    "Triangle",
    "Triangle Arm Bar",
    "Twister",
    "Wrist Lock",
    "Z-Lock",
  ],
  Takedown: [
    "Ankle Pick",
    "Arm Drag",
    "Arm Throw",
    "Body Lock",
    "Collar Drag",
    "Cow Catcher",
    "Double Leg",
    "Duck Under",
    "Fireman's Carry",
    "Flying Scissor",
    "Foot Sweep",
    "Guard Pull",
    "Head & Arm Throw",
    "Hip Throw",
    "Imanari Roll",
    "Inside Trip",
    "Knee Tap",
    "Lateral throw",
    "Low Single",
    "Outside Trip",
    "Single Leg",
    "Slide By",
    "Snapdown",
    "Trip",
    "Uchi Mata",
  ],
  Sweep: [
    "Baby Bolo Sweep",
    "Bolo Sweep",
    "Electric Chair Sweep",
    "Half Guard Sweep",
    "Hip Bump Sweep",
    "K-Guard Sweep",
    "Kiss of the Dragon",
    "Lumber Jack Sweep",
    "Omoplata Sweep",
    "Scissor Sweep",
    "Shoulder Crunch Sweep",
    "Single X Sweep",
    "Sweep",
    "Waiter Sweep",
  ],
  "Chest to Back": ["Back", "Back Body Triangle"],
  "Back Take": ["Berimbolo"],
  Passing: [
    "Body Lock Pass",
    "Double Under Pass",
    "Guard Pass",
    "Knee Cut",
    "Leg Drag",
    "Over/Under Pass",
    "Stack Pass",
    "X Pass",
  ],
  "Bottom Position": [
    "Butterfly Guard",
    "Deep Half Guard",
    "Del La Riva",
    "K Guard",
    "Reverse De La Riva",
    "Rubber Guard",
    "Shin to Shin Guard",
    "Single Leg X",
    "Turtle",
    "Turtle Position",
    "X Guard",
    "Z Guard",
  ],
  "Leg Entry": ["False Reap"],
  "Top Position": ["Front Head", "Knee on Belly", "Twister Side Control"],
  "Chest to Chest": ["Half Guard", "Mount", "North/South", "Side Control"],
} as const;

export type EventType = keyof typeof EVENT_TYPE_PRESETS;

export const EVENT_TYPES = Object.keys(EVENT_TYPE_PRESETS) as EventType[];

export const EVENT_TYPE_BADGE_VARIANTS: Record<
  EventType,
  "position" | "transition" | "submission"
> = {
  "Neutral Position": "position",
  Submission: "submission",
  Takedown: "transition",
  Sweep: "transition",
  "Chest to Back": "position",
  "Back Take": "transition",
  Passing: "transition",
  "Bottom Position": "position",
  "Leg Entry": "transition",
  "Top Position": "position",
  "Chest to Chest": "position",
};

export const COMPETITION_PRESETS = [
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
] as const;

export type CompetitionPreset = (typeof COMPETITION_PRESETS)[number];

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
  moveName: string;
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
  movesByEventType: typeof EVENT_TYPE_PRESETS;
  competitions: readonly CompetitionPreset[];
}

export const DEFAULT_PRESETS: EventPresets = {
  movesByEventType: EVENT_TYPE_PRESETS,
  competitions: COMPETITION_PRESETS,
};
