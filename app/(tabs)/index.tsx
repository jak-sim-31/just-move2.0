import React, { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getActiveDayCount,
  getRewardLevel,
  getStartOfWeek,
  getEndOfWeek,
  getTotalPoints,
  filterRecordsByRange,
} from '@/constants/stats';

const POSITIONS = [
  { key: '누워있다', icon: 'bed-outline',       lib: 'Ionicons', color: '#5B8DB8' },
  { key: '앉아있다', icon: 'seat-passenger',    lib: 'MCI',      color: '#7B68EE' },
  { key: '서있다',   icon: 'person-outline',    lib: 'Ionicons', color: '#20B2AA' },
  { key: '걷고 있다', icon: 'walk',             lib: 'MCI',      color: '#F5A623' },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    records,
    setPosition,
    getTodayRecords,
    getTodaySchedules,
    getExerciseById,
    updateSchedule,
    setExercise,
    setMinutes,
    resetSession,
    schedules,
  } = useApp();

  const todayRecords = getTodayRecords();
  const todaySchedules = getTodaySchedules();

  // Reward summary computations
  const { levelInfo, weekDays, totalPoints } = useMemo(() => {
    const now = new Date();
    const pts = getTotalPoints(records);
    const level = getRewardLevel(pts);
    const ws = getStartOfWeek(now);
    const we = getEndOfWeek(now);
    const weekRec = filterRecordsByRange(records, ws, we);
    const wdays = getActiveDayCount(weekRec);
    return { levelInfo: level, weekDays: wdays, totalPoints: pts };
  }, [records]);

  // In-app schedule notification check
  const notifRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    notifRef.current = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;
      const today = now.toISOString().slice(0, 10);

      schedules.forEach((s) => {
        if (
          s.status === 'scheduled' &&
          s.scheduledTime === currentTime &&
          (s.scheduledDate === today || s.repeatType === 'daily')
        ) {
          const ex = getExerciseById(s.exerciseId);
          if (ex) {
            Alert.alert(
              '운동 시간이에요!',
              `${ex.title} ${s.targetValue}${s.targetUnit} 예약한 시간이 됐어요.`,
              [
                { text: '나중에', style: 'cancel' },
                {
                  text: '지금 시작',
                  onPress: () => {
                    setExercise(ex);
                    setMinutes(ex.durationMinutes);
                    updateSchedule(s.id, 'completed');
                    router.push('/exercise/video');
                  },
                },
              ]
            );
          }
        }
      });
    }, 30000);
    return () => {
      if (notifRef.current) clearInterval(notifRef.current);
    };
  }, [schedules]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetSession();
    router.push('/exercise/position');
  };

  const handleQuickPosition = (pos: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetSession();
    setPosition(pos);
    router.push('/exercise/time');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>JUST MOVE</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            생각은 그만, 일단 움직여요.
          </Text>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.primary }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{todayRecords.length}</Text>
            <Text style={styles.statLabel}>오늘 완료</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{todaySchedules.length}</Text>
            <Text style={styles.statLabel}>예약 운동</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {todayRecords.reduce((sum, r) => sum + (r.isCompleted ? 1 : 0), 0)}
            </Text>
            <Text style={styles.statLabel}>꼼지락 성공</Text>
          </View>
        </View>

        {/* Reward summary card */}
        <Pressable
          style={({ pressed }) => [
            styles.rewardCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => router.push('/(tabs)/records')}
        >
          <View style={styles.rewardLeft}>
            <View style={styles.rewardLevelRow}>
              <View style={[styles.rewardLevelBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.rewardLevelBadgeText}>Lv.{levelInfo.level}</Text>
              </View>
              <Text style={[styles.rewardLevelName, { color: colors.text }]} numberOfLines={1}>
                {levelInfo.levelName}
              </Text>
            </View>
            <Text style={[styles.rewardPoints, { color: colors.textSecondary }]}>
              누적 <Text style={{ color: colors.primary, fontWeight: '800' }}>{totalPoints}</Text> MOVE
            </Text>
            <Text style={[styles.rewardWeek, { color: colors.textSecondary }]}>
              이번 주 활동일: <Text style={{ fontWeight: '700', color: colors.text }}>{weekDays}/7일</Text>
            </Text>
          </View>
          <View style={styles.rewardRight}>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${levelInfo.progressPct}%` as any,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressHint, { color: colors.textSecondary }]}>
              {levelInfo.level < 5
                ? `→ Lv.${levelInfo.level + 1}`
                : '최고 레벨'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>

        {/* Today's schedules */}
        {todaySchedules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>오늘 예약</Text>
            {todaySchedules.slice(0, 2).map((s) => {
              const ex = getExerciseById(s.exerciseId);
              if (!ex) return null;
              return (
                <Pressable
                  key={s.id}
                  style={({ pressed }) => [
                    styles.scheduleCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.accent,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExercise(ex);
                    setMinutes(ex.durationMinutes);
                    router.push('/exercise/video');
                  }}
                >
                  <View style={[styles.scheduleAccent, { backgroundColor: colors.accent }]} />
                  <View style={styles.scheduleContent}>
                    <Text style={[styles.scheduleTime, { color: colors.accent }]}>
                      {s.scheduledTime}
                    </Text>
                    <Text style={[styles.scheduleTitle, { color: colors.text }]}>{ex.title}</Text>
                    <Text style={[styles.scheduleGoal, { color: colors.textSecondary }]}>
                      목표 {s.targetValue}{s.targetUnit}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recent records */}
        {todayRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>오늘 기록</Text>
            <View style={styles.recordsRow}>
              {todayRecords.slice(0, 3).map((r) => {
                const ex = getExerciseById(r.exerciseId);
                return (
                  <View
                    key={r.id}
                    style={[
                      styles.recordBadge,
                      {
                        backgroundColor: r.isCompleted ? colors.successLight : colors.secondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={r.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={r.isCompleted ? colors.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.recordBadgeText,
                        { color: r.isCompleted ? colors.success : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {ex?.title ?? '운동'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Main CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.mainCta,
            { backgroundColor: colors.accent, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          onPress={handleStart}
        >
          <Ionicons name="flash" size={24} color="#FFFFFF" />
          <Text style={styles.mainCtaText}>지금 움직이기</Text>
        </Pressable>

        {/* Quick position shortcuts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>지금 어떤 자세예요?</Text>
          <View style={styles.posGrid}>
            {POSITIONS.map((p) => (
              <Pressable
                key={p.key}
                style={({ pressed }) => [
                  styles.posCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
                onPress={() => handleQuickPosition(p.key)}
              >
                {p.lib === 'Ionicons' ? (
                  <Ionicons name={p.icon as any} size={26} color={p.color} />
                ) : (
                  <MaterialCommunityIcons name={p.icon as any} size={26} color={p.color} />
                )}
                <Text style={[styles.posLabel, { color: colors.text }]}>{p.key}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  logo: { fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  tagline: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  statsCard: {
    borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12,
  },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Reward summary card
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
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

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  scheduleCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, marginBottom: 8, overflow: 'hidden',
  },
  scheduleAccent: { width: 4, height: '100%', minHeight: 64 },
  scheduleContent: { flex: 1, padding: 12 },
  scheduleTime: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  scheduleTitle: { fontSize: 15, fontWeight: '600' },
  scheduleGoal: { fontSize: 12, marginTop: 2 },
  recordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recordBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  recordBadgeText: { fontSize: 12, fontWeight: '600', maxWidth: 80 },
  mainCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 18, marginBottom: 32,
    shadowColor: '#F5A623', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  mainCtaText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  posGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  posCard: {
    width: '47%', borderRadius: 12, borderWidth: 1,
    padding: 16, alignItems: 'center', gap: 8,
  },
  posLabel: { fontSize: 14, fontWeight: '600' },
});
