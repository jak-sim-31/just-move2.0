import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { POSTURE_ORDER, PostureIcon, useLegacyPad } from '@/components/Legacy';
import { Crop } from '@/components/Crop';
import { MonthCalendar } from '@/components/MonthCalendar';
import { BarChart, StatBox } from '@/components/StatsUI';
import { DAILY_PHRASES, exerciseById } from '@/data/content';
import { appConfig } from '@/lib/config';
import { addDays, formatMonthDay, kstHour, kstTime, timeBandOf, todayKey, weekStartKey } from '@/lib/date';
import { nextReminderLabel } from '@/lib/reminder';
import { rewardLevel, totalPoints } from '@/lib/rewards';
import { todaySchedules } from '@/lib/schedule';
import { isItemCompleted } from '@/lib/session';
import { dropsOnDate, monthSummary, rangeSummary, recentSessions, weekMinutes } from '@/lib/stats';
import { POSTURE_LABEL, type Schedule } from '@/lib/types';
import { useStore } from '@/store/AppStore';

/**
 * H-01 홈
 * 첫 화면(스크롤 없이): 머리(로고 + 알림 버튼) → 움직이자는 메시지와 [지금 움직이기] → 오늘 예약 → 농장 카드
 * 농장 카드는 첫 화면 아래쪽에 걸리게 두어 "수확까지 n개"로 스크롤과 다음 행동을 이끈다.
 * 스크롤 아래: 오늘 통계 카드 → 레벨 카드 → 이번 달·캘린더 → 최근 운동 → 주간 그래프
 */

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function HomeScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { ready, sessions, farm, inProgress, schedules, settings, getWelcome, startSession, updateSchedule } = useStore();
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

  const todaySum = rangeSummary(sessions, today, today);
  const todayDone = todaySum.sessions.reduce(
    (acc, s) =>
      acc + s.items.filter((it) => isItemCompleted(it.playedSec, it.skipped, appConfig.videoSec, appConfig.completeRatio)).length,
    0,
  );
  const todays = todaySchedules(schedules, today);
  const level = rewardLevel(totalPoints(sessions));
  const ws = weekStartKey(today);
  const weekDays = rangeSummary(sessions, ws, addDays(ws, 6)).movedDays;
  const month = monthSummary(sessions, today);
  const recent = recentSessions(sessions, 3);
  const dropsToday = dropsOnDate(sessions, today);
  const hasHistory = sessions.some((s) => s.creditedMin >= 1);
  const toHarvest = appConfig.dropsPerHarvest - farm.cropProgress;
  const notifLabel = nextReminderLabel(settings, Date.now(), dropsToday, appConfig.dropDailyLimit);
  const notifOn = settings.notification.enabled;

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/exercise/position');
  };
  const startSchedule = (s: Schedule) => {
    const ex = exerciseById(s.exerciseId);
    if (!ex) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startSession(ex.postures[0], s.plannedMin, ex.id);
    if (s.repeatType === 'once') updateSchedule(s.id, { status: 'completed' });
    router.push('/exercise/play');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 첫 화면 ───────────────────────────── */}
        {/* 머리: 로고 + 알림 버튼 */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>JUST MOVE</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>생각은 그만, 일단 움직여요.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={notifOn ? `알림 설정, 다음 알림 ${notifLabel}` : '알림 설정, 알림 꺼짐'}
            onPress={() => router.push('/my/notifications')}
            style={({ pressed }) => [
              styles.bell,
              {
                backgroundColor: notifOn ? colors.card : colors.secondary,
                borderColor: notifOn ? colors.border : colors.secondary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={notifOn ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={notifOn ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.bellText, { color: notifOn ? colors.text : colors.textSecondary }]}>
              {notifOn ? `${notifLabel} 알림` : '알림 꺼짐'}
            </Text>
          </Pressable>
        </View>

        {/* 움직이자는 메시지 + 지금 움직이기 (가장 중요한 행동) */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroPhrase}>{phrase}</Text>
          <View style={styles.heroGuide} accessibilityLabel="앉아서, 누워서, 서서, 걸으면서 지금 자세 그대로 1분">
            <View style={styles.heroIcons}>
              {POSTURE_ORDER.map((p) => (
                <View key={p} style={styles.heroIconWrap}>
                  <PostureIcon posture={p} size={14} color="#FFFFFF" />
                </View>
              ))}
            </View>
            <Text style={styles.heroGuideText}>
              {POSTURE_ORDER.map((p) => POSTURE_LABEL[p]).join('·')}, 지금 자세 그대로 1분
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지금 움직이기"
            style={({ pressed }) => [
              styles.mainCta,
              { backgroundColor: colors.accent, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={start}
          >
            <Ionicons name="flash" size={24} color="#FFFFFF" />
            <Text style={styles.mainCtaText}>지금 움직이기</Text>
          </Pressable>
          {inProgress ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/exercise/play')}
              style={({ pressed }) => [styles.resumeBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.resumeText}>멈춘 운동 이어서 하기</Text>
            </Pressable>
          ) : null}
          <Text style={styles.heroStatus}>
            {todaySum.minutes > 0
              ? `오늘 ${todaySum.minutes}분 움직였어요 · 물방울 ${dropsToday}/${appConfig.dropDailyLimit}`
              : `오늘의 첫 1분을 시작해 볼까요? · 물방울 ${dropsToday}/${appConfig.dropDailyLimit}`}
          </Text>
        </View>

        {/* 오늘 예약 (있을 때만, 시간이 정해진 일이라 위쪽) */}
        {todays.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>오늘 예약</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/schedule')} hitSlop={8}>
                <Text style={[styles.link, { color: colors.primary }]}>+ 예약하기</Text>
              </Pressable>
            </View>
            {todays.slice(0, 2).map((s) => {
              const ex = exerciseById(s.exerciseId);
              if (!ex) return null;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.scheduledTime} ${ex.name} 시작`}
                  style={({ pressed }) => [
                    styles.scheduleCard,
                    { backgroundColor: colors.card, borderColor: colors.accent, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => startSchedule(s)}
                >
                  <View style={[styles.scheduleAccent, { backgroundColor: colors.accent }]} />
                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleTime, { color: colors.accent }]}>
                      {s.scheduledTime} · {s.plannedMin}분
                    </Text>
                    <Text style={[styles.scheduleTitle, { color: colors.text }]}>{ex.name}</Text>
                    <Text style={[styles.scheduleGoal, { color: colors.textSecondary }]}>
                      목표 {s.targetValue}
                      {ex.targetUnit}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* 농장 카드 — 첫 화면 아래쪽에 걸려 스크롤을 이끈다 */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`나의 농장, 수확까지 물방울 ${toHarvest}개`}
          onPress={() => router.push('/(tabs)/farm')}
          style={({ pressed }) => [
            styles.farmCard,
            { backgroundColor: '#EAF5EC', borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Crop stage={farm.cropProgress} size={84} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.farmTitle, { color: colors.text }]}>나의 농장</Text>
            <Text style={[styles.farmHook, { color: colors.text }]}>
              수확까지 물방울 <Text style={{ color: '#3B9AE1', fontWeight: '800' }}>{toHarvest}개</Text>
            </Text>
            <View style={styles.farmTrack}>
              <View
                style={[
                  styles.farmFill,
                  { width: `${(farm.cropProgress / appConfig.dropsPerHarvest) * 100}%` },
                ]}
              />
            </View>
            <Text style={[styles.farmLine, { color: colors.textSecondary }]}>
              보유 물방울 {farm.drops}개 · 바구니 {farm.harvestCount}개
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        {/* ── 스크롤 아래 ────────────────────────── */}
        {/* 오늘 통계 카드 (수정 전) */}
        <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{todaySum.count}</Text>
            <Text style={styles.statLabel}>오늘 완료</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{todays.length}</Text>
            <Text style={styles.statLabel}>예약 운동</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{todayDone}</Text>
            <Text style={styles.statLabel}>꼼지락 성공</Text>
          </View>
        </View>

        {/* 레벨 카드 (수정 전 보상 요약) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="기록 보기"
          style={({ pressed }) => [
            styles.rewardCard,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.push('/(tabs)/records')}
        >
          <View style={styles.rewardLeft}>
            <View style={styles.rewardLevelRow}>
              <View style={[styles.rewardLevelBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.rewardLevelBadgeText}>Lv.{level.level}</Text>
              </View>
              <Text style={[styles.rewardLevelName, { color: colors.text }]} numberOfLines={1}>
                {level.levelName}
              </Text>
            </View>
            <Text style={[styles.rewardPoints, { color: colors.textSecondary }]}>
              누적 <Text style={{ color: colors.primary, fontWeight: '800' }}>{level.totalPoints}</Text> MOVE
            </Text>
            <Text style={[styles.rewardWeek, { color: colors.textSecondary }]}>
              이번 주 활동일: <Text style={{ fontWeight: '700', color: colors.text }}>{weekDays}/7일</Text>
            </Text>
          </View>
          <View style={styles.rewardRight}>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${level.progressPct}%` }]} />
            </View>
            <Text style={[styles.progressHint, { color: colors.textSecondary }]}>
              {level.level < 5 ? `→ Lv.${level.level + 1}` : '최고 레벨'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>

        {!hasHistory ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.emptyText, { color: colors.text }]}>1분이라도 움직이면 첫 기록이 만들어져요.</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>이번 달</Text>
              <View style={styles.statGrid}>
                <StatBox label="운동한 날" value={`${month.movedDays}일`} />
                <StatBox label="총 운동 시간" value={`${month.totalMinutes}분`} />
              </View>
              <View style={{ marginTop: 12 }}>
                <MonthCalendar sessions={sessions} />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>최근 운동</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/records')} hitSlop={8}>
                  <Text style={[styles.link, { color: colors.primary }]}>전체 보기</Text>
                </Pressable>
              </View>
              {recent.map((s) => {
                const first = exerciseById(s.items.find((it) => !it.skipped)?.exerciseId ?? s.items[0]?.exerciseId ?? '');
                const more = new Set(s.items.filter((it) => !it.skipped).map((it) => it.exerciseId)).size - 1;
                return (
                  <View key={s.id} style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                        {first?.name ?? POSTURE_LABEL[s.posture]}
                        {more > 0 ? ` 외 ${more}개` : ''}
                      </Text>
                      <Text style={[styles.recentMeta, { color: colors.textSecondary }]}>
                        {formatMonthDay(s.localDate)} {kstTime(s.startedAt)} · {POSTURE_LABEL[s.posture]}
                      </Text>
                    </View>
                    <Text style={[styles.recentMin, { color: colors.primary }]}>{s.creditedMin}분</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>이번 주 운동 시간 (분)</Text>
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <BarChart values={weekMinutes(sessions, today).map((d) => d.minutes)} labels={WEEK_LABELS} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  logo: { fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  tagline: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  bell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  bellText: { fontSize: 12, fontWeight: '700' },
  hero: { borderRadius: 16, padding: 20, gap: 12, marginBottom: 16 },
  heroPhrase: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', lineHeight: 28 },
  heroGuide: { gap: 6 },
  heroIcons: { flexDirection: 'row', gap: 6 },
  heroIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGuideText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  mainCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  mainCtaText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 10,
  },
  resumeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  heroStatus: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '700' },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, marginBottom: 8, overflow: 'hidden' },
  scheduleAccent: { width: 4, alignSelf: 'stretch', minHeight: 64 },
  scheduleContent: { flex: 1, padding: 12 },
  scheduleTime: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  scheduleTitle: { fontSize: 15, fontWeight: '600' },
  scheduleGoal: { fontSize: 12, marginTop: 2 },
  farmCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 24, gap: 12 },
  farmTitle: { fontSize: 13, fontWeight: '700' },
  farmHook: { fontSize: 17, fontWeight: '800' },
  farmTrack: { height: 6, borderRadius: 3, backgroundColor: '#CFE3D3', overflow: 'hidden' },
  farmFill: { height: 6, borderRadius: 3, backgroundColor: '#3B9AE1' },
  farmLine: { fontSize: 12 },
  statsCard: { borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  rewardCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 24, gap: 12 },
  rewardLeft: { flex: 1, gap: 4 },
  rewardLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardLevelBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  rewardLevelBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  rewardLevelName: { fontSize: 13, fontWeight: '700' },
  rewardPoints: { fontSize: 13 },
  rewardWeek: { fontSize: 12 },
  rewardRight: { alignItems: 'flex-end', gap: 4, minWidth: 80 },
  progressBg: { height: 6, borderRadius: 3, width: 80, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressHint: { fontSize: 11 },
  statGrid: { flexDirection: 'row', gap: 8 },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  recentTitle: { fontSize: 15, fontWeight: '700' },
  recentMeta: { fontSize: 12, marginTop: 2 },
  recentMin: { fontSize: 16, fontWeight: '800' },
  chartCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyBox: { borderRadius: 12, padding: 14, marginBottom: 24 },
  emptyText: { fontSize: 14, lineHeight: 22 },
});
