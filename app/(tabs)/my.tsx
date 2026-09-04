import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  getRewardLevel,
  getTotalPoints,
  getUnlockedBadges,
  type BadgeInfo,
  type LevelInfo,
} from '@/constants/stats';

// ─── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({
  badge,
  colors,
}: {
  badge: BadgeInfo;
  colors: ReturnType<typeof useColors>;
}) {
  const isLocked = !badge.unlocked;
  return (
    <View
      style={[
        badgeStyles.card,
        {
          backgroundColor: isLocked ? colors.muted : colors.card,
          borderColor: isLocked ? colors.border : colors.primary,
        },
      ]}
    >
      <View
        style={[
          badgeStyles.iconWrap,
          { backgroundColor: isLocked ? colors.secondary : '#FFF8E7' },
        ]}
      >
        <Ionicons
          name={isLocked ? 'lock-closed-outline' : 'trophy'}
          size={22}
          color={isLocked ? colors.textSecondary : colors.accent}
        />
      </View>
      <View style={badgeStyles.info}>
        <Text
          style={[
            badgeStyles.name,
            { color: isLocked ? colors.textSecondary : colors.text },
          ]}
        >
          {badge.name}
        </Text>
        <Text style={[badgeStyles.cond, { color: colors.textSecondary }]}>
          {badge.unlocked ? badge.condition : badge.currentProgress ?? badge.condition}
        </Text>
      </View>
      {badge.unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      )}
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  cond: { fontSize: 12, marginTop: 2 },
});

// ─── Nav button ────────────────────────────────────────────────────────────────
function NavBtn({
  icon, label, onPress, colors,
}: {
  icon: string; label: string; onPress: () => void; colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        navStyles.btn,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <Text style={[navStyles.label, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}
const navStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
});

// ─── Main MY screen ───────────────────────────────────────────────────────────
export default function MyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { records } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalPoints = useMemo(() => getTotalPoints(records), [records]);
  const levelInfo: LevelInfo = useMemo(() => getRewardLevel(totalPoints), [totalPoints]);
  const badges: BadgeInfo[] = useMemo(() => getUnlockedBadges(records), [records]);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const isMax = levelInfo.level === 5;

  const goWeekly = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/records');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.primary }]}>MY</Text>

      {/* ── 나의 MOVE 섹션 ─────────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>나의 MOVE</Text>

      {/* Level card */}
      <View style={[styles.levelCard, { backgroundColor: colors.primary }]}>
        <View style={styles.levelTopRow}>
          <View>
            <Text style={styles.levelBadgeText}>Level {levelInfo.level}</Text>
            <Text style={styles.levelName}>{levelInfo.levelName}</Text>
          </View>
          <View style={styles.moveBox}>
            <Text style={styles.moveNum}>{levelInfo.totalPoints}</Text>
            <Text style={styles.moveLabel}>MOVE</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${levelInfo.progressPct}%` as any, backgroundColor: colors.accent },
            ]}
          />
        </View>

        {isMax ? (
          <Text style={styles.levelHint}>최고 레벨을 달성했어요 🎉</Text>
        ) : (
          <Text style={styles.levelHint}>
            다음 레벨까지 {(levelInfo.nextLevelPoints ?? 0) - levelInfo.totalPoints} MOVE 남음
          </Text>
        )}
      </View>

      {/* Badges */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>획득한 배지</Text>
      {unlockedBadges.length === 0 ? (
        <View style={[styles.emptyBadge, { backgroundColor: colors.secondary }]}>
          <Ionicons name="trophy-outline" size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyBadgeText, { color: colors.textSecondary }]}>
            아직 획득한 배지가 없어요. 운동을 완료하면 첫 배지를 받아요!
          </Text>
        </View>
      ) : (
        unlockedBadges.map((b) => <BadgeCard key={b.id} badge={b} colors={colors} />)
      )}

      {lockedBadges.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
            잠긴 배지
          </Text>
          {lockedBadges.map((b) => <BadgeCard key={b.id} badge={b} colors={colors} />)}
        </>
      )}

      {/* Navigation links */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>통계 보기</Text>
      <NavBtn
        icon="bar-chart-outline"
        label="주간 통계 보기"
        onPress={goWeekly}
        colors={colors}
      />
      <NavBtn
        icon="calendar-outline"
        label="월간 통계 보기"
        onPress={goWeekly}
        colors={colors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  // Level card
  levelCard: { borderRadius: 16, padding: 20, gap: 12 },
  levelTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadgeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  levelName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  moveBox: { alignItems: 'flex-end' },
  moveNum: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 36 },
  moveLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  progressBg: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  levelHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  // Empty badge
  emptyBadge: {
    borderRadius: 12, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 8,
  },
  emptyBadgeText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
