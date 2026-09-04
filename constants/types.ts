export type Position = '누워있다' | '앉아있다' | '서있다' | '걷고 있다';
export type Difficulty = '쉬움' | '보통' | '어려움';

export interface Exercise {
  id: string;
  title: string;
  summary: string;
  detailContent: string;
  youtubeUrl: string;
  youtubeEmbedUrl: string;
  positions: Position[];
  durationMinutes: number;
  targetValue: number;
  targetUnit: string;
  bodyPart: string;
  difficulty: Difficulty;
  equipment: string;
  caution: string;
  isActive: boolean;
  /** Optional point override — if absent, derived from difficulty */
  rewardPoints?: number;
}

export interface ExerciseSchedule {
  id: string;
  exerciseId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  targetValue: number;
  targetUnit: string;
  repeatType: 'once' | 'daily';
  notificationEnabled: boolean;
  status: 'scheduled' | 'completed' | 'skipped';
  createdAt: string;
}

export interface ExerciseRecord {
  id: string;
  exerciseId: string;
  scheduleId?: string;
  completedAt: string;         // ISO 8601
  startPosition: string;
  availableMinutes?: number;
  completedValue: number;
  completedUnit: string;
  isCompleted: boolean;
  memo?: string;
  /** Points earned at the moment of completion (optional for backward compat) */
  earnedPoints?: number;
  /** Difficulty label snapshot: '가볍게' | '보통' | '도전' */
  difficultyLabel?: string;
}

export interface ProofPhoto {
  id: string;
  recordId: string;
  imageBase64: string;
  capturedAt: string;
  memo?: string;
  isPrivate: boolean;
}
