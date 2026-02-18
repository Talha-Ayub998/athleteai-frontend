export type PlayerType = 'Me' | 'Opponent' | 'AI Coach';

export type EventType = 'Position' | 'Transition' | 'Submission' | 'Note';

export type MatchType = 'Gi' | 'No-Gi';

export type BeltLevel = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';

export type CompetitionPreset = 
  | 'IBJJF'
  | 'ADCC'
  | 'EBI'
  | 'Grappling Industries'
  | 'NAGA'
  | 'Good Fight'
  | 'F2W'
  | 'WNO'
  | 'In-House'
  | 'Training'
  | 'Other';

export type PositionPreset = 
  | 'Guard' 
  | 'Half Guard' 
  | 'Mount' 
  | 'Side Control' 
  | 'Back Control' 
  | 'Turtle' 
  | 'Standing'
  | 'Closed Guard'
  | 'Open Guard'
  | 'Knee on Belly'
  | 'North South'
  | 'Other';

export type TransitionPreset = 
  | 'Sweep' 
  | 'Takedown' 
  | 'Guard Pass' 
  | 'Escape' 
  | 'Reversal'
  | 'Pull Guard'
  | 'Other';

export type SubmissionPreset = 
  | 'Armbar'
  | 'Triangle'
  | 'Rear Naked Choke'
  | 'Guillotine'
  | 'Kimura'
  | 'Americana'
  | 'Heel Hook'
  | 'Ankle Lock'
  | 'Head and Arm Choke'
  | 'Ezekiel'
  | 'Other';

export type NotePreset = 
  | 'Match Start'
  | 'Match End'
  | 'Coach Note'
  | 'Observation'
  | 'Other';

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
    'Guard',
    'Half Guard',
    'Mount',
    'Side Control',
    'Back Control',
    'Turtle',
    'Standing',
    'Closed Guard',
    'Open Guard',
    'Knee on Belly',
    'North South',
    'Other',
  ],
  transitions: [
    'Sweep',
    'Takedown',
    'Guard Pass',
    'Escape',
    'Reversal',
    'Pull Guard',
    'Other',
  ],
  submissions: [
    'Armbar',
    'Triangle',
    'Rear Naked Choke',
    'Guillotine',
    'Kimura',
    'Americana',
    'Heel Hook',
    'Ankle Lock',
    'Head and Arm Choke',
    'Ezekiel',
    'Other',
  ],
  notes: [
    'Match Start',
    'Match End',
    'Coach Note',
    'Observation',
    'Other',
  ],
  competitions: [
    'IBJJF',
    'ADCC',
    'EBI',
    'Grappling Industries',
    'NAGA',
    'Good Fight',
    'F2W',
    'WNO',
    'In-House',
    'Training',
    'Other',
  ],
};
