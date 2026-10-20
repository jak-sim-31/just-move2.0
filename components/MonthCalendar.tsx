import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { addMonths, formatKoMonth, monthStartKey, todayKey, weekdayOf } from '@/lib/date';
import { monthDays } from '@/lib/stats';
import type { Session } from '@/lib/types';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 움직인 날에만 표시한다. 쉰 날에는 아무 표시도 하지 않는다. */
export function MonthCalendar({
  sessions,
  month: controlledMonth,
  onMonthChange,
}: {
  sessions: Session[];
  /** 지정하면 부모가 달을 관리한다 */
  month?: string;
  onMonthChange?: (month: string) => void;
}) {
  const colors = useColors();
  const today = todayKey();
  const [innerMonth, setInnerMonth] = useState(monthStartKey(today));
  const month = controlledMonth ?? innerMonth;
  const setMonth = (m: string) => (onMonthChange ? onMonthChange(m) : setInnerMonth(m));
  const days = monthDays(sessions, month);
  const lead = weekdayOf(month);
  const cells: ({ key: string; moved: boolean } | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.head}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => setMonth(addMonths(month, -1))}
          style={styles.nav}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{formatKoMonth(month)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => setMonth(addMonths(month, 1))}
          style={styles.nav}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {WEEK.map((w) => (
          <Text key={w} style={[styles.weekday, { color: colors.textSecondary }]}>
            {w}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((c, i) => (
            <View key={i} style={styles.cell}>
              {c ? (
                <View
                  style={[
                    styles.dayCircle,
                    c.moved && { backgroundColor: colors.accent },
                    c.key === today && !c.moved && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: c.moved ? '#FFFFFF' : colors.text, fontWeight: c.moved ? '800' : '500' },
                    ]}
                  >
                    {Number(c.key.slice(8))}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 18, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, paddingVertical: 6 },
  cell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15 },
});
