import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button, useScreenPad } from '@/components/ui';
import { MonthCalendar } from '@/components/MonthCalendar';
import { DayBars } from '@/components/WeekBars';
import { exerciseById } from '@/data/content';
import {
  addDays,
  addMonths,
  formatKoDate,
  formatKoMonth,
  monthStartKey,
  todayKey,
  weekStartKey,
} from '@/lib/date';
import {
  countedSessions,
  monthSummary,
  mostPlayedExercise,
  perceivedCounts,
  weekMinutes,
} from '@/lib/stats';
import { PERCEIVED_LABEL, POSTURE_LABEL, type Session } from '@/lib/types';
import { useStore } from '@/store/AppStore';

type Mode = 'week' | 'month';

export default function RecordsScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { sessions } = useStore();
  const today = todayKey();
  const [mode, setMode] = useState<Mode>('week');
  const [weekStart, setWeekStart] = useState(weekStartKey(today));
  const [month, setMonth] = useState(monthStartKey(today));
  const [openId, setOpenId] = useState<string | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const inRange = (s: Session) =>
    mode === 'week'
      ? s.localDate >= weekStart && s.localDate <= weekEnd
      : s.localDate.startsWith(month.slice(0, 7));
  const ranged = countedSessions(sessions).filter(inRange);
  const list = [...ranged].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const movedDays = new Set(ranged.map((s) => s.localDate)).size;
  const totalMin = ranged.reduce((sum, s) => sum + s.creditedMin, 0);
  const summary = mode === 'month' ? monthSummary(sessions, month) : { movedDays, totalMinutes: totalMin };
  const topId = mostPlayedExercise(ranged);
  const perceived = perceivedCounts(ranged);
  const perceivedTotal = perceived.light + perceived.fit + perceived.hard;

  const move = (dir: -1 | 1) =>
    mode === 'week' ? setWeekStart(addDays(weekStart, dir * 7)) : setMonth(addMonths(month, dir));
  const rangeLabel =
    mode === 'week'
      ? `${formatKoDate(weekStart).replace(/ \(.\)/, '')} ~ ${formatKoDate(weekEnd).replace(/ \(.\)/, '')}`
      : formatKoMonth(month);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>운동 기록</Text>

        <View style={[styles.toggle, { backgroundColor: colors.secondary }]}>
          {(['week', 'month'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === m }}
              onPress={() => setMode(m)}
              style={[styles.toggleBtn, mode === m && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.toggleText, { color: mode === m ? colors.primary : colors.textSecondary }]}>
                {m === 'week' ? '주간' : '월간'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.rangeRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="이전" onPress={() => move(-1)} style={styles.nav} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={[styles.rangeText, { color: colors.text }]}>{rangeLabel}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="다음" onPress={() => move(1)} style={styles.nav} hitSlop={8}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{summary.movedDays}일</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>운동한 날</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{summary.totalMinutes}분</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 운동 시간</Text>
          </View>
        </View>

        {topId ? (
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            가장 많이 한 동작 · {exerciseById(topId)?.name}
          </Text>
        ) : null}

        {mode === 'week' ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]}>일별 운동 시간</Text>
            <DayBars data={weekMinutes(sessions, weekStart)} />
          </View>
        ) : (
          <MonthCalendar sessions={sessions} month={month} onMonthChange={setMonth} />
        )}

        {perceivedTotal > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.text }]}>체감 난이도</Text>
            <View style={styles.tags}>
              {(['light', 'fit', 'hard'] as const).map((p) => (
                <View key={p} style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.text }]}>
                    {PERCEIVED_LABEL[p]} {perceived[p]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[styles.section, { color: colors.text, marginTop: 8 }]}>운동 목록</Text>
        {list.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              이 기간의 운동 기록이 아직 없어요.
            </Text>
            <Button label="지금 움직이기" variant="accent" onPress={() => router.push('/exercise/position')} />
          </View>
        ) : (
          list.map((s) => {
            const open = openId === s.id;
            const names = s.items.filter((it) => !it.skipped).map((it) => exerciseById(it.exerciseId)?.name ?? '');
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenId(open ? null : s.id)}
                style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.itemTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={open ? 3 : 1}>
                      {names.filter(Boolean).join(', ') || POSTURE_LABEL[s.posture]}
                    </Text>
                    <Text style={[styles.note, { color: colors.textSecondary }]}>
                      {formatKoDate(s.localDate)} · {POSTURE_LABEL[s.posture]}
                      {s.perceived ? ` · ${PERCEIVED_LABEL[s.perceived]}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.itemMin, { color: colors.primary }]}>{s.creditedMin}분</Text>
                </View>
                {open ? (
                  <View style={[styles.detail, { borderTopColor: colors.border }]}>
                    {s.items.map((it, i) => (
                      <Text key={i} style={[styles.note, { color: colors.textSecondary }]}>
                        {exerciseById(it.exerciseId)?.name} · {Math.round(it.playedSec)}초
                        {it.skipped ? ' (넘김)' : ''}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  title: { fontSize: 26, fontWeight: '800' },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  toggleText: { fontSize: 16, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  rangeText: { fontSize: 17, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 14, marginTop: 2 },
  note: { fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  section: { fontSize: 17, fontWeight: '800' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  tagText: { fontSize: 14, fontWeight: '600' },
  item: { borderWidth: 1, borderRadius: 14, padding: 14 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemMin: { fontSize: 18, fontWeight: '800' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 4 },
});
