/** 모든 날짜 계산은 한국시간(KST, UTC+9) 기준 'YYYY-MM-DD' 키로 한다. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function dateKey(input: Date | number | string): string {
  const t = new Date(input).getTime() + KST_OFFSET_MS;
  return new Date(t).toISOString().slice(0, 10);
}

export function todayKey(now: number = Date.now()): string {
  return dateKey(now);
}

function keyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  return new Date(keyToUtcMs(key) + n * DAY_MS).toISOString().slice(0, 10);
}

/** b - a (일 단위) */
export function diffDays(a: string, b: string): number {
  return Math.round((keyToUtcMs(b) - keyToUtcMs(a)) / DAY_MS);
}

/** 월요일 시작 주의 첫날 */
export function weekStartKey(key: string): string {
  const dow = new Date(keyToUtcMs(key)).getUTCDay(); // 0=일
  return addDays(key, dow === 0 ? -6 : 1 - dow);
}

export function monthStartKey(key: string): string {
  return key.slice(0, 7) + '-01';
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0=일 … 6=토 */
export function weekdayOf(key: string): number {
  return new Date(keyToUtcMs(key)).getUTCDay();
}

/** 'HH' (KST 시) */
export function kstHour(now: number = Date.now()): number {
  return new Date(now + KST_OFFSET_MS).getUTCHours();
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
export const weekdayLabel = (key: string): string => WEEKDAY_KO[weekdayOf(key)];

/** '10월 20일 (화)' */
export function formatKoDate(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${m}월 ${d}일 (${weekdayLabel(key)})`;
}

/** '2026년 10월' */
export function formatKoMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${y}년 ${m}월`;
}

/** 'YYYY-MM-01' 기준으로 n개월 이동 */
export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

export function timeBandOf(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
