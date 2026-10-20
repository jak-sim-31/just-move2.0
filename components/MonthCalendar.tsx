import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { PeriodNav } from '@/components/StatsUI';
import { addMonths, daysInMonth, formatKoMonth, monthStartKey, todayKey, weekdayOf, addDays } from '@/lib/date';
import { sessionCountsByDate } from '@/lib/stats';
import type { Session } from '@/lib/types';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 수정 전 월간 통계의 캘린더(357e0d7)와 같은 모양.
 * 움직인 날만 칠하고(2회 이상이면 횟수), 쉰 날에는 아무 표시도 하지 않는다.
 */
export function MonthGrid({ sessions, month }: { sessions: Session[]; month: string }) {
  const colors = useColors();
  const today = todayKey();
  const counts = sessionCountsByDate(sessions);
  const start = monthStartKey(month);
  const lead = weekdayOf(start);
  const total = daysInMonth(start);
  const cells = Math.ceil((lead + total) / 7) * 7;

  return (
    <View>
      <View style={styles.calHeader}>
        {WEEK.map((w) => (
          <Text key={w} style={[styles.calDayLabel, { color: colors.textSecondary }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {Array.from({ length: cells }).map((_, idx) => {
          const dayNum = idx - lead + 1;
          const valid = dayNum >= 1 && dayNum <= total;
          const key = valid ? addDays(start, dayNum - 1) : '';
          const count = valid ? counts[key] ?? 0 : 0;
          const isToday = key === today;
          const active = count > 0;
          return (
            <View
              key={idx}
              accessibilityLabel={valid ? `${dayNum}일${active ? ` 운동 ${count}회` : ''}` : undefined}
              style={[
                styles.calCell,
                active && { backgroundColor: colors.primary },
                isToday && !active && { borderWidth: 1.5, borderColor: colors.primary },
              ]}
            >
              {valid ? (
                <>
                  <Text
                    style={[
                      styles.calDayNum,
                      { color: active ? '#FFFFFF' : isToday ? colors.primary : colors.text },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {count > 1 ? (
                    <Text style={[styles.calCount, { color: 'rgba(255,255,255,0.8)' }]}>{count}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** 홈에서 쓰는 캘린더: 달 이동 + 캘린더 (기본 카드 안) */
export function MonthCalendar({ sessions }: { sessions: Session[] }) {
  const colors = useColors();
  const current = monthStartKey(todayKey());
  const [month, setMonth] = useState(current);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <PeriodNav
        big
        label={formatKoMonth(month)}
        onPrev={() => setMonth(addMonths(month, -1))}
        onNext={() => setMonth(addMonths(month, 1))}
        nextDisabled={month >= current}
      />
      <MonthGrid sessions={sessions} month={month} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  calHeader: { flexDirection: 'row', marginBottom: 4 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  calDayNum: { fontSize: 12, fontWeight: '600' },
  calCount: { fontSize: 9, fontWeight: '700' },
});
