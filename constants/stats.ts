import type { ExerciseRecord } from './types';

// ─── Reward points ─────────────────────────────────────────────────────────────
/**
 * Maps exercise difficulty (Korean string) to MOVE points.
 * If rewardPointsOverride is set on the exercise, that takes precedence.
 */
export function getRewardPoints(
  difficulty?: string,
  rewardPointsOverride?: number
): number {
  if (rewardPointsOverride !== undefined) return rewardPointsOverride;
  if (difficulty === '어려움') return 40;
  if (difficulty === '쉬움') return 10;
  return 20; // '보통' or unknown → default 20
}

/** Map Korean Difficulty to display label */
export function getDifficultyLabel(difficulty?: string): '가볍게' | '보통' | '도전' {
  if (difficulty === '쉬움') return '가볍게';
  if (difficulty === '어려움') return '도전';
  return '보통';
}

// ─── Safe date parser ──────────────────────────────────────────────────────────
function safeDate(iso: string): Date | null {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Date range helpers ────────────────────────────────────────────────────────
/** Monday 00:00:00.000 of the week containing `date` (local time) */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon …
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sunday 23:59:59.999 of the same week */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** First day of the month 00:00:00.000 (local time) */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/** Last day of the month 23:59:59.999 (local time) */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// ─── Record filters ────────────────────────────────────────────────────────────
export function filterRecordsByRange(
  records: ExerciseRecord[],
  start: Date,
  end: Date
): ExerciseRecord[] {
  return records.filter((r) => {
    const d = safeDate(r.completedAt);
    if (!d) return false;
    return d >= start && d <= end;
  });
}

// ─── Aggregations ─────────────────────────────────────────────────────────────
/** Number of unique calendar days (local time) that have at least one record */
export function getActiveDayCount(records: ExerciseRecord[]): number {
  const days = new Set<string>();
  records.forEach((r) => {
    const d = safeDate(r.completedAt);
    if (d) days.add(localDateStr(d));
  });
  return days.size;
}

/** Sum of availableMinutes across records (0 if absent) */
export function getTotalDuration(records: ExerciseRecord[]): number {
  return records.reduce((s, r) => s + (r.availableMinutes ?? 0), 0);
}

/** Sum of earnedPoints; falls back to 20 per record if field is absent */
export function getTotalPoints(records: ExerciseRecord[]): number {
  return records.reduce((s, r) => s + (r.earnedPoints ?? 20), 0);
}

/** Counts grouped by difficulty label */
export function getDifficultyCounts(
  records: ExerciseRecord[]
): { easy: number; normal: number; hard: number } {
  const counts = { easy: 0, normal: 0, hard: 0 };
  records.forEach((r) => {
    if (r.difficultyLabel === '가볍게') counts.easy++;
    else if (r.difficultyLabel === '도전') counts.hard++;
    else counts.normal++;
  });
  return counts;
}

/** Returns the exerciseId that appears most often in records, or null */
export function getMostCompletedExercise(records: ExerciseRecord[]): string | null {
  if (records.length === 0) return null;
  const cnt: Record<string, number> = {};
  records.forEach((r) => { cnt[r.exerciseId] = (cnt[r.exerciseId] ?? 0) + 1; });
  let best = '';
  let max = 0;
  Object.entries(cnt).forEach(([id, n]) => { if (n > max) { max = n; best = id; } });
  return best || null;
}

// ─── Streak helpers ────────────────────────────────────────────────────────────
function getSortedUniqueDays(records: ExerciseRecord[]): string[] {
  const days = new Set<string>();
  records.forEach((r) => {
    const d = safeDate(r.completedAt);
    if (d) days.add(localDateStr(d));
  });
  return Array.from(days).sort();
}

/** Consecutive-day streak up to and including today (or yesterday) */
export function getCurrentStreak(records: ExerciseRecord[]): number {
  const days = getSortedUniqueDays(records);
  if (days.length === 0) return 0;

  const today = localDateStr(new Date());
  const yesterday = localDateStr(new Date(Date.now() - 86_400_000));

  let anchor: Date;
  if (days.includes(today)) {
    anchor = new Date();
  } else if (days.includes(yesterday)) {
    anchor = new Date(Date.now() - 86_400_000);
  } else {
    return 0;
  }

  let streak = 0;
  let check = new Date(anchor);
  while (true) {
    if (days.includes(localDateStr(check))) {
      streak++;
      check = new Date(check.getTime() - 86_400_000);
    } else {
      break;
    }
  }
  return streak;
}

/** All-time longest consecutive-day streak */
export function getLongestStreak(records: ExerciseRecord[]): number {
  const days = getSortedUniqueDays(records);
  if (days.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const diff =
      (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86_400_000;
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

// ─── Level system ──────────────────────────────────────────────────────────────
export interface LevelInfo {
  level: number;
  levelName: string;
  totalPoints: number;
  nextLevelPoints: number | null;
  progressPct: number;
}

const LEVEL_TABLE = [
  { min: 0,    max: 99,        level: 1, name: '움직임 준비 중' },
  { min: 100,  max: 299,       level: 2, name: '몸 깨우는 사람' },
  { min: 300,  max: 599,       level: 3, name: '꾸준한 움직임'  },
  { min: 600,  max: 999,       level: 4, name: '루틴 메이커'    },
  { min: 1000, max: Infinity,  level: 5, name: 'Just Mover'     },
] as const;

export function getRewardLevel(totalPoints: number): LevelInfo {
  const entry =
    LEVEL_TABLE.find((l) => totalPoints <= l.max) ??
    LEVEL_TABLE[LEVEL_TABLE.length - 1];
  const isMax = entry.level === 5;
  const nextLevelPoints: number | null = isMax ? null : (entry.max as number) + 1;
  const range = isMax ? 1 : (entry.max as number) - entry.min + 1;
  const progressPct = isMax
    ? 100
    : Math.min(100, Math.max(0, Math.round(((totalPoints - entry.min) / range) * 100)));
  return { level: entry.level, levelName: entry.name, totalPoints, nextLevelPoints, progressPct };
}

// ─── Badge system ──────────────────────────────────────────────────────────────
export interface BadgeInfo {
  id: string;
  name: string;
  condition: string;
  unlocked: boolean;
  currentProgress?: string;
}

export function getUnlockedBadges(records: ExerciseRecord[]): BadgeInfo[] {
  const days = getSortedUniqueDays(records);

  // first_move
  const firstMove = records.length >= 1;

  // weekly_3 / weekly_5 — check all weeks that appear in records
  let weekly3 = false;
  let weekly5 = false;
  days.forEach((ds) => {
    const d = new Date(ds + 'T00:00:00');
    const ws = getStartOfWeek(d);
    const we = getEndOfWeek(d);
    const count = days.filter((x) => {
      const xd = new Date(x + 'T00:00:00');
      return xd >= ws && xd <= we;
    }).length;
    if (count >= 5) weekly5 = true;
    if (count >= 3) weekly3 = true;
  });

  // monthly_10 — check all months
  let monthly10 = false;
  days.forEach((ds) => {
    const d = new Date(ds + 'T00:00:00');
    const ms = getStartOfMonth(d);
    const me = getEndOfMonth(d);
    const count = days.filter((x) => {
      const xd = new Date(x + 'T00:00:00');
      return xd >= ms && xd <= me;
    }).length;
    if (count >= 10) monthly10 = true;
  });

  // streak_7
  const streak7 = getLongestStreak(records) >= 7;

  // Progress hints for locked badges
  const now = new Date();
  const cwDays = days.filter((ds) => {
    const d = new Date(ds + 'T00:00:00');
    return d >= getStartOfWeek(now) && d <= getEndOfWeek(now);
  }).length;
  const cmDays = days.filter((ds) => {
    const d = new Date(ds + 'T00:00:00');
    return d >= getStartOfMonth(now) && d <= getEndOfMonth(now);
  }).length;
  const longest = getLongestStreak(records);

  return [
    {
      id: 'first_move',
      name: '첫 움직임',
      condition: '첫 운동 1회 완료',
      unlocked: firstMove,
    },
    {
      id: 'weekly_3',
      name: '주 3회 달성',
      condition: '같은 주에 운동한 날짜 3일',
      unlocked: weekly3,
      currentProgress: weekly3 ? undefined : `이번 주 ${cwDays}/3일`,
    },
    {
      id: 'weekly_5',
      name: '주 5회 달성',
      condition: '같은 주에 운동한 날짜 5일',
      unlocked: weekly5,
      currentProgress: weekly5 ? undefined : `이번 주 ${cwDays}/5일`,
    },
    {
      id: 'monthly_10',
      name: '월 10일 달성',
      condition: '같은 달에 운동한 날짜 10일',
      unlocked: monthly10,
      currentProgress: monthly10 ? undefined : `이번 달 ${cmDays}/10일`,
    },
    {
      id: 'streak_7',
      name: '7일 연속',
      condition: '연속 7일 이상 운동',
      unlocked: streak7,
      currentProgress: streak7 ? undefined : `최고 연속 ${longest}일`,
    },
  ];
}

// ─── Weekly bar chart data ─────────────────────────────────────────────────────
/** Returns [Mon…Sun] completion counts for the week starting at weekStart */
export function getWeekDayCounts(
  records: ExerciseRecord[],
  weekStart: Date
): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  records.forEach((r) => {
    const d = safeDate(r.completedAt);
    if (!d) return;
    const diff = Math.floor(
      (d.getTime() - weekStart.getTime()) / 86_400_000
    );
    if (diff >= 0 && diff <= 6) counts[diff]++;
  });
  return counts;
}

// ─── Monthly calendar data ─────────────────────────────────────────────────────
/** Returns { [dayOfMonth]: count } for the given year/month (0-indexed month) */
export function getMonthDayCounts(
  records: ExerciseRecord[],
  year: number,
  month: number
): Record<number, number> {
  const counts: Record<number, number> = {};
  records.forEach((r) => {
    const d = safeDate(r.completedAt);
    if (!d) return;
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      counts[day] = (counts[day] ?? 0) + 1;
    }
  });
  return counts;
}
