import { addDays, monthStartKey, weekStartKey } from '@/lib/date';
import type { Difficulty, Exercise, Session, SessionItem } from '@/lib/types';

/**
 * 수정 전 앱의 MOVE 포인트·레벨·배지 규칙을 운동 1회(세션) 단위로 옮긴 것.
 * '7일 연속' 배지는 "연속 기록 초기화를 드러내지 않는다"는 운영 원칙 때문에 뺐다.
 */

const POINTS: Record<Difficulty, number> = { 쉬움: 10, 보통: 20, 어려움: 40 };

export function difficultyPoints(d?: Difficulty): number {
  return d ? POINTS[d] : 20;
}

/** 완료한 동작마다 난이도 포인트. 1분 이상 움직였는데 완료한 동작이 없으면 10 */
export function sessionPoints(
  items: SessionItem[],
  creditedMin: number,
  isCompleted: (it: SessionItem) => boolean,
  exerciseOf: (id: string) => Exercise | undefined,
): number {
  if (creditedMin < 1) return 0;
  const sum = items
    .filter(isCompleted)
    .reduce((acc, it) => acc + difficultyPoints(exerciseOf(it.exerciseId)?.difficulty), 0);
  return sum > 0 ? sum : 10;
}

export function totalPoints(sessions: Session[]): number {
  return sessions.reduce((acc, s) => acc + (s.points ?? 0), 0);
}

export interface LevelInfo {
  level: number;
  levelName: string;
  totalPoints: number;
  nextLevelPoints: number | null;
  progressPct: number;
}

const LEVEL_TABLE = [
  { min: 0, max: 99, level: 1, name: '움직임 준비 중' },
  { min: 100, max: 299, level: 2, name: '몸 깨우는 사람' },
  { min: 300, max: 599, level: 3, name: '꾸준한 움직임' },
  { min: 600, max: 999, level: 4, name: '루틴 메이커' },
  { min: 1000, max: Infinity, level: 5, name: 'Just Mover' },
] as const;

export function rewardLevel(points: number): LevelInfo {
  const entry = LEVEL_TABLE.find((l) => points <= l.max) ?? LEVEL_TABLE[LEVEL_TABLE.length - 1];
  const isMax = entry.level === 5;
  const nextLevelPoints = isMax ? null : entry.max + 1;
  const range = isMax ? 1 : entry.max - entry.min + 1;
  const progressPct = isMax
    ? 100
    : Math.min(100, Math.max(0, Math.round(((points - entry.min) / range) * 100)));
  return { level: entry.level, levelName: entry.name, totalPoints: points, nextLevelPoints, progressPct };
}

export interface BadgeInfo {
  id: string;
  name: string;
  condition: string;
  unlocked: boolean;
  currentProgress?: string;
}

/** 움직인 날 목록과 오늘 날짜로 배지 계산 */
export function badges(movedKeys: string[], today: string): BadgeInfo[] {
  const days = [...new Set(movedKeys)].sort();
  const countInWeek = (k: string) => {
    const ws = weekStartKey(k);
    const we = addDays(ws, 6);
    return days.filter((d) => d >= ws && d <= we).length;
  };
  const countInMonth = (k: string) => {
    const prefix = monthStartKey(k).slice(0, 7);
    return days.filter((d) => d.startsWith(prefix)).length;
  };
  const weekly3 = days.some((d) => countInWeek(d) >= 3);
  const weekly5 = days.some((d) => countInWeek(d) >= 5);
  const monthly10 = days.some((d) => countInMonth(d) >= 10);
  const cw = countInWeek(today);
  const cm = countInMonth(today);
  return [
    { id: 'first_move', name: '첫 움직임', condition: '첫 운동 1회 완료', unlocked: days.length >= 1 },
    {
      id: 'weekly_3',
      name: '주 3회 달성',
      condition: '같은 주에 운동한 날짜 3일',
      unlocked: weekly3,
      currentProgress: weekly3 ? undefined : `이번 주 ${cw}/3일`,
    },
    {
      id: 'weekly_5',
      name: '주 5회 달성',
      condition: '같은 주에 운동한 날짜 5일',
      unlocked: weekly5,
      currentProgress: weekly5 ? undefined : `이번 주 ${cw}/5일`,
    },
    {
      id: 'monthly_10',
      name: '월 10일 달성',
      condition: '같은 달에 운동한 날짜 10일',
      unlocked: monthly10,
      currentProgress: monthly10 ? undefined : `이번 달 ${cm}/10일`,
    },
  ];
}

/** 수정 전 월간 통계의 응원 문구 (운동한 날 수 기준 5단계) */
export function monthlyMessage(movedDays: number): string {
  if (movedDays === 0) return '이번 달의 첫 움직임을 시작해보세요.';
  if (movedDays <= 4) return '작은 움직임이 시작됐어요. 다음 한 번을 이어가세요.';
  if (movedDays <= 9) return '움직이는 날이 늘고 있어요. 이번 달 10일에 도전해보세요.';
  if (movedDays <= 19) return '운동이 생활 속 루틴으로 자리 잡고 있어요.';
  return '대단해요! 이번 달 대부분의 날을 움직임으로 채웠어요.';
}
