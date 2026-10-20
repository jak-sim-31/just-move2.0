import { diffDays } from '@/lib/date';

export interface WelcomeMessage {
  id: string;
  restBucket: '1-2' | '3+';
  relation: 'long' | 'other';
  text: string;
}

/** 최근에 보여 준 문구(최대 2개)를 제외하고 하나를 고른다. 후보가 모자라면 제외 규칙을 푼다. */
export function pickMessage<T extends { id: string }>(
  candidates: T[],
  recentIds: string[],
  rng: () => number = Math.random,
): T | null {
  if (candidates.length === 0) return null;
  const recent = recentIds.slice(-2);
  const fresh = candidates.filter((c) => !recent.includes(c.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  return pool[Math.floor(rng() * pool.length)];
}

export function restBucketOf(restDays: number): '1-2' | '3+' {
  return restDays >= 3 ? '3+' : '1-2';
}

/** 앱 이용 1개월 초과 그리고 운동한 날 20일 이상이면 '오래 이용' */
export function relationOf(
  firstUseKey: string,
  todayKey: string,
  movedDayCount: number,
): 'long' | 'other' {
  return diffDays(firstUseKey, todayKey) > 30 && movedDayCount >= 20 ? 'long' : 'other';
}

/**
 * 재시작 환영 화면 노출 조건
 * - 운동한 날이 한 번이라도 있고, 어제 움직이지 않았고, 오늘도 아직 움직이지 않았고,
 *   오늘 환영 화면을 본 적이 없을 때
 */
export function welcomeRestDays(
  movedKeys: string[],
  today: string,
  welcomeShownKey: string | null,
): number | null {
  if (movedKeys.length === 0) return null;
  if (welcomeShownKey === today) return null;
  const sorted = [...movedKeys].sort();
  const last = sorted[sorted.length - 1];
  const gap = diffDays(last, today); // 마지막 운동일로부터 지난 날
  if (gap <= 1) return null; // 오늘 또는 어제 움직임
  return gap - 1; // 쉰 날 수 (화면에는 표시하지 않음, 문구 선택에만 사용)
}
