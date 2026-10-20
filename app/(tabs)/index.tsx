import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button, useScreenPad } from '@/components/ui';
import { Crop } from '@/components/Crop';
import { MonthCalendar } from '@/components/MonthCalendar';
import { DayBars } from '@/components/WeekBars';
import { DAILY_PHRASES, exerciseById } from '@/data/content';
import { appConfig } from '@/lib/config';
import { formatKoDate, kstHour, timeBandOf, todayKey } from '@/lib/date';
import { dropsOnDate, monthSummary, recentSessions, weekMinutes } from '@/lib/stats';
import { POSTURE_LABEL } from '@/lib/types';
import { useStore } from '@/store/AppStore';

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function HomeScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { ready, sessions, farm, inProgress, getWelcome } = useStore();
  const [checked, setChecked] = useState(false);

  // 하루 이상 쉬고 돌아왔다면 홈보다 먼저 환영 화면
  useEffect(() => {
    if (!ready || checked) return;
    setChecked(true);
    if (getWelcome()) router.replace('/welcome');
  }, [ready, checked, getWelcome]);

  const today = todayKey();
  const phrase = useMemo(() => {
    const band = timeBandOf(kstHour());
    const list = DAILY_PHRASES.filter((p) => p.band === band);
    return list.length ? list[hashOf(today + band) % list.length].text : '지금 1분만 움직여 볼까요?';
  }, [today]);

  if (!ready || !checked) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const month = monthSummary(sessions, today);
  const recent = recentSessions(sessions, 3);
  const dropsToday = dropsOnDate(sessions, today);
  const hasHistory = sessions.some((s) => s.creditedMin >= 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.logo, { color: colors.primary }]}>JUST MOVE</Text>
        <Text style={[styles.phrase, { color: colors.text }]}>{phrase}</Text>

        <View style={styles.cta}>
          <Button label="지금 움직이기" variant="accent" icon="play" onPress={() => router.push('/exercise/position')} style={styles.ctaMain} />
          {inProgress ? (
            <Button label="이어서 하기" variant="outline" onPress={() => router.push('/exercise/play')} />
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="나의 농장으로 이동"
          onPress={() => router.push('/(tabs)/farm')}
          style={[styles.card, styles.farmCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Crop stage={farm.cropProgress} size={84} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>나의 농장</Text>
            <Text style={[styles.cardLine, { color: colors.textSecondary }]}>
              성장 {farm.cropProgress}/{appConfig.dropsPerHarvest} · 보유 물방울 {farm.drops}개
            </Text>
            <Text style={[styles.cardLine, { color: colors.textSecondary }]}>
              오늘 받은 물방울 {dropsToday}/{appConfig.dropDailyLimit}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Text style={[styles.section, { color: colors.text }]}>이번 달</Text>
        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{month.movedDays}일</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>운동한 날</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{month.totalMinutes}분</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>총 운동 시간</Text>
          </View>
        </View>

        {!hasHistory ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardLine, { color: colors.textSecondary }]}>
              첫 1분을 시작해 보세요. 운동한 날이 여기에 쌓여요.
            </Text>
          </View>
        ) : (
          <>
            <MonthCalendar sessions={sessions} />

            <Text style={[styles.section, { color: colors.text }]}>최근 운동</Text>
            <View style={{ gap: 8 }}>
              {recent.map((s) => {
                const first = exerciseById(s.items[0]?.exerciseId ?? '');
                return (
                  <View
                    key={s.id}
                    style={[styles.recent, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                        {first?.name ?? POSTURE_LABEL[s.posture]}
                        {s.items.length > 1 ? ` 외 ${s.items.length - 1}개` : ''}
                      </Text>
                      <Text style={[styles.cardLine, { color: colors.textSecondary }]}>
                        {formatKoDate(s.localDate)} · {POSTURE_LABEL[s.posture]}
                      </Text>
                    </View>
                    <Text style={[styles.recentMin, { color: colors.primary }]}>{s.creditedMin}분</Text>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.section, { color: colors.text }]}>이번 주 운동 시간</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <DayBars data={weekMinutes(sessions, today)} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  logo: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  phrase: { fontSize: 22, fontWeight: '800', lineHeight: 30 },
  cta: { gap: 10 },
  ctaMain: { minHeight: 64 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  farmCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  cardLine: { fontSize: 14, lineHeight: 20 },
  section: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 14, marginTop: 2 },
  recent: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  recentTitle: { fontSize: 16, fontWeight: '700' },
  recentMin: { fontSize: 18, fontWeight: '800' },
});
