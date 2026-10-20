import { addDays, diffDays } from '@/lib/date';

/**
 * 검증 지표 (사용자 한 명 기준 계산. 베타 단계에서는 서버가 사용자별로 계산해 합산한다)
 *
 * 7일 성공 사용자: 첫 사용일(D0)부터 D6까지 (a) 매일 1분 이상 운동했거나
 *                  (b) 1일 이상 쉬었다가 다시 운동한 적이 있는 사람
 * 복귀: 움직인 날과 다음 움직인 날 사이에 쉰 날이 1일 / 2일 / 3일 이상
 * 14일 참여 유지: 마지막 3일(D11~D13) 중 1회 이상 운동
 * 운동 실천: 14일 중 7일 이상 운동
 */
export type RestBucket = '1' | '2' | '3+';

export interface Return {
  /** 쉬기 전 마지막으로 움직인 날 */
  from: string;
  /** 돌아와서 다시 움직인 날 */
  to: string;
  restDays: number;
  bucket: RestBucket;
}

export interface UserMetrics {
  firstUseKey: string;
  /** 7일 창이 끝났는지 (오늘 > D6) */
  week1Complete: boolean;
  movedDaysIn7: number;
  movedEveryDayIn7: boolean;
  /** 7일 안에 돌아온 기록 */
  returnsIn7: Return[];
  week1Success: boolean;
  day1Moved: boolean;
  fortnightComplete: boolean;
  movedDaysIn14: number;
  retainedLast3Of14: boolean;
  practiced7of14: boolean;
}

const bucketOf = (rest: number): RestBucket => (rest >= 3 ? '3+' : rest === 2 ? '2' : '1');

export function returnsOf(movedKeys: string[]): Return[] {
  const sorted = [...new Set(movedKeys)].sort();
  const out: Return[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const rest = diffDays(sorted[i - 1], sorted[i]) - 1;
    if (rest >= 1) {
      out.push({ from: sorted[i - 1], to: sorted[i], restDays: rest, bucket: bucketOf(rest) });
    }
  }
  return out;
}

export function userMetrics(
  movedKeys: string[],
  firstUseKey: string,
  today: string,
): UserMetrics {
  const moved = new Set(movedKeys);
  const inRange = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => addDays(firstUseKey, from + i));

  const d7 = inRange(0, 6);
  const d14 = inRange(0, 13);
  const movedIn7 = d7.filter((k) => moved.has(k));
  const movedIn14 = d14.filter((k) => moved.has(k));
  const returnsIn7 = returnsOf(movedIn7);
  const movedEveryDayIn7 = movedIn7.length === 7;

  return {
    firstUseKey,
    week1Complete: diffDays(firstUseKey, today) >= 7,
    movedDaysIn7: movedIn7.length,
    movedEveryDayIn7,
    returnsIn7,
    week1Success: movedEveryDayIn7 || returnsIn7.length > 0,
    day1Moved: moved.has(firstUseKey),
    fortnightComplete: diffDays(firstUseKey, today) >= 14,
    movedDaysIn14: movedIn14.length,
    retainedLast3Of14: inRange(11, 13).some((k) => moved.has(k)),
    practiced7of14: movedIn14.length >= 7,
  };
}
