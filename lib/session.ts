/**
 * 운동 시간 규칙
 * - 실제 운동 시간(초)을 1·3·5분 단위로 내린 값이 '인정 시간'
 * - 1분 미만은 0 (기록·보상 없음)
 */
export type CreditedMin = 0 | 1 | 3 | 5;

export function creditedMinutes(actualSec: number): CreditedMin {
  if (actualSec >= 300) return 5;
  if (actualSec >= 180) return 3;
  if (actualSec >= 60) return 1;
  return 0;
}

/** 하루 한도를 반영한 물방울 지급 개수 (인정 1분당 1개) */
export function dropsToGrant(
  creditedMin: number,
  alreadyToday: number,
  dailyLimit: number,
): number {
  return Math.max(0, Math.min(creditedMin, dailyLimit - alreadyToday));
}

/** 동작 1개를 '완료'로 칠지: 건너뛰지 않았고 영상의 일정 비율 이상 재생 */
export function isItemCompleted(
  playedSec: number,
  skipped: boolean,
  videoSec: number,
  completeRatio: number,
): boolean {
  return !skipped && playedSec >= videoSec * completeRatio;
}
