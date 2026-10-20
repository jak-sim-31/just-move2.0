import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { weekdayLabel } from '@/lib/date';

/** 일별 인정 시간(분) 막대 그래프 */
export function DayBars({
  data,
}: {
  data: { key: string; minutes: number }[];
}) {
  const colors = useColors();
  const max = Math.max(5, ...data.map((d) => d.minutes));
  return (
    <View style={styles.row}>
      {data.map((d) => (
        <View key={d.key} style={styles.col} accessibilityLabel={`${d.key} ${d.minutes}분`}>
          <Text style={[styles.value, { color: colors.textSecondary }]}>
            {d.minutes > 0 ? d.minutes : ''}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                {
                  height: `${(d.minutes / max) * 100}%`,
                  backgroundColor: d.minutes > 0 ? colors.accent : 'transparent',
                },
              ]}
            />
          </View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{weekdayLabel(d.key)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, height: 140, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', height: '100%' },
  value: { fontSize: 12, height: 16 },
  track: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 0 },
  label: { fontSize: 12, marginTop: 4 },
});
