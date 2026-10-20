import type { Schedule } from '@/lib/types';

/** 오늘 남은 예약 (한번만: 오늘 날짜, 매일 반복: 매일) — 수정 전 getTodaySchedules와 같은 기준 */
export function todaySchedules(schedules: Schedule[], today: string): Schedule[] {
  return schedules
    .filter((s) => s.status === 'scheduled' && (s.scheduledDate === today || s.repeatType === 'daily'))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * 지금 알려야 할 예약: 예약 시각이 지났고(최대 windowMin분 이내), 오늘 아직 알리지 않은 것.
 * 수정 전에는 정확히 그 분에만 알렸으나, 앱을 잠깐 닫았다 열어도 놓치지 않도록 여유를 둔다.
 */
export function dueSchedule(
  schedules: Schedule[],
  today: string,
  nowHHMM: string,
  windowMin = 30,
): Schedule | null {
  const now = toMin(nowHHMM);
  return (
    todaySchedules(schedules, today).find((s) => {
      const diff = now - toMin(s.scheduledTime);
      return diff >= 0 && diff <= windowMin && s.lastNotifiedDate !== today;
    }) ?? null
  );
}
