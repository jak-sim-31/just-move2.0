import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  getDifficultyLabel,
  getLongestStreak,
  getRewardLevel,
  getRewardPoints,
  getTotalPoints,
  getUnlockedBadges,
  type BadgeInfo,
  type LevelInfo,
} from '@/constants/stats';
import type { ExerciseRecord } from '@/constants/types';

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  let bg = colors.secondary;
  let fg = colors.textSecondary;
  if (label === '도전') { bg = '#E8F0F7'; fg = colors.primary; }
  else if (label === '보통') { bg = '#FFF3E0'; fg = '#B45309'; }
  return (
    <View style={[styles.diffBadge, { backgroundColor: bg }]}>
      <Text style={[styles.diffBadgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CompleteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    selectedExercise,
    selectedPosition,
    selectedMinutes,
    records,
    addRecord,
    setCurrentRecordId,
    generateId,
    resetSession,
  } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const ex = selectedExercise;

  const [completedValue, setCompletedValue] = useState<string>(
    ex ? String(ex.targetValue) : '0'
  );
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Reward phase state
  const [phase, setPhase] = useState<'entry' | 'reward'>('entry');
  const [rewardData, setRewardData] = useState<{
    earnedPoints: number;
    levelInfo: LevelInfo;
    newBadges: BadgeInfo[];
    difficultyLabel: string;
    exerciseTitle: string;
    savedId: string;
  } | null>(null);

  const preSaveBadgeIds = useRef<Set<string>>(new Set());

  const handleSave = async (goPhoto = false) => {
    if (saving || !ex) return;
    setSaving(true);
    setSaveError(false);

    try {
      // Snapshot pre-save state
      const preBadges = getUnlockedBadges(records);
      preSaveBadgeIds.current = new Set(
        preBadges.filter((b) => b.unlocked).map((b) => b.id)
      );

      const diffLabel = getDifficultyLabel(ex.difficulty);
      const earned = getRewardPoints(ex.difficulty, ex.rewardPoints);

      const id = generateId();
      const record: ExerciseRecord = {
        id,
        exerciseId: ex.id,
        completedAt: new Date().toISOString(),
        startPosition: selectedPosition ?? '',
        availableMinutes: selectedMinutes ?? undefined,
        completedValue: parseFloat(completedValue) || 0,
        completedUnit: ex.targetUnit,
        isCompleted: true,
        memo: memo || undefined,
        earnedPoints: earned,
        difficultyLabel: diffLabel,
      };

      await addRecord(record);
      setCurrentRecordId(id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (goPhoto) {
        router.push('/exercise/photo');
        return;
      }

      // Compute post-save stats from the projected new records array
      const newRecords = [record, ...records];
      const totalPoints = getTotalPoints(newRecords);
      const levelInfo = getRewardLevel(totalPoints);
      const postBadges = getUnlockedBadges(newRecords);
      const newBadges = postBadges.filter(
        (b) => b.unlocked && !preSaveBadgeIds.current.has(b.id)
      );

      setRewardData({
        earnedPoints: earned,
        levelInfo,
        newBadges,
        difficultyLabel: diffLabel,
        exerciseTitle: ex.title,
        savedId: id,
      });
      setPhase('reward');
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!ex) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>완료할 운동이 없어요</Text>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.goHome}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>홈으로 가기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Reward phase ─────────────────────────────────────────────────────────────
  if (phase === 'reward' && rewardData) {
    const { earnedPoints, levelInfo, newBadges, difficultyLabel, exerciseTitle } = rewardData;
    const isMax = levelInfo.level === 5;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 24, paddingBottom: botPad + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.rewardTop}>
            <View style={[styles.rewardIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.rewardHeadline, { color: colors.text }]}>오늘도 움직였어요!</Text>

            <View style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.rewardExName, { color: colors.text }]}>{exerciseTitle}</Text>
              <DifficultyBadge label={difficultyLabel} colors={colors} />
            </View>

            {/* Points earned */}
            <View style={[styles.pointsBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.pointsEarned}>+{earnedPoints} MOVE</Text>
            </View>

            {/* Accumulated MOVE */}
            <Text style={[styles.totalPoints, { color: colors.text }]}>
              누적{' '}
              <Text style={{ color: colors.primary, fontWeight: '800' }}>
                {levelInfo.totalPoints}
              </Text>{' '}
              MOVE
            </Text>
          </Animated.View>

          {/* Level card */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.levelRow}>
                <Text style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                  {'Lv.' + levelInfo.level}
                </Text>
                <Text style={[styles.levelName, { color: colors.text }]}>{levelInfo.levelName}</Text>
              </View>
              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.accent, width: `${levelInfo.progressPct}%` as any },
                  ]}
                />
              </View>
              {isMax ? (
                <Text style={[styles.levelHint, { color: colors.success }]}>
                  최고 레벨을 달성했어요 🎉
                </Text>
              ) : (
                <Text style={[styles.levelHint, { color: colors.textSecondary }]}>
                  다음 레벨까지{' '}
                  {(levelInfo.nextLevelPoints ?? 0) - levelInfo.totalPoints} MOVE 남음
                </Text>
              )}
            </View>

            {/* New badges */}
            {newBadges.length > 0 && (
              <View style={[styles.badgeBox, { backgroundColor: '#FFF8E7', borderColor: colors.accent }]}>
                <View style={styles.badgeHeader}>
                  <Ionicons name="trophy" size={18} color={colors.accent} />
                  <Text style={[styles.badgeHeaderText, { color: colors.accent }]}>
                    새 배지 획득!
                  </Text>
                </View>
                {newBadges.map((b) => (
                  <Text key={b.id} style={[styles.badgeName, { color: colors.text }]}>
                    {b.name}
                  </Text>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom buttons */}
        <View
          style={[
            styles.bottom,
            { paddingBottom: botPad + 16, backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.outlineBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              resetSession();
              router.replace('/(tabs)/records');
            }}
          >
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>기록 보기</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.fillBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              resetSession();
              router.replace('/(tabs)');
            }}
          >
            <Text style={styles.fillBtnText}>홈으로</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Entry phase ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 16, paddingBottom: botPad + 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Success animation */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.successSection}>
            <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.success }]}>꼼지락 성공!</Text>
            <Text style={[styles.successSub, { color: colors.textSecondary }]}>
              오늘도 실제로 움직였어요
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            {/* Exercise name */}
            <View
              style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.exCardLabel, { color: colors.textSecondary }]}>운동</Text>
              <Text style={[styles.exCardTitle, { color: colors.text }]}>{ex.title}</Text>
              <Text style={[styles.exCardGoal, { color: colors.textSecondary }]}>
                목표 {ex.targetValue} {ex.targetUnit}
              </Text>
            </View>

            {/* Completed value */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              실제로 몇 번 했나요?
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={() =>
                  setCompletedValue((v) => String(Math.max(0, Number(v) - 1)))
                }
                style={[styles.stepper, { backgroundColor: colors.secondary }]}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <TextInput
                value={completedValue}
                onChangeText={setCompletedValue}
                keyboardType="numeric"
                style={[styles.valueInput, { color: colors.text }]}
                selectTextOnFocus
              />
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                {ex.targetUnit}
              </Text>
              <Pressable
                onPress={() => setCompletedValue((v) => String(Number(v) + 1))}
                style={[styles.stepper, { backgroundColor: colors.secondary }]}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {/* Memo */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>메모 (선택)</Text>
            <TextInput
              value={memo}
              onChangeText={setMemo}
              placeholder="오늘 느낀 점을 남겨보세요..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.memoInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={3}
            />

            {/* Save error */}
            {saveError && (
              <View style={[styles.errorBox, { backgroundColor: colors.destructiveLight }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  저장에 실패했어요. 다시 시도해 주세요.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom buttons */}
      <View
        style={[
          styles.bottom,
          {
            paddingBottom: botPad + 16,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.photoBtn,
            {
              borderColor: colors.primary,
              opacity: saving ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => handleSave(true)}
          disabled={saving}
        >
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
          <Text style={[styles.photoBtnText, { color: colors.primary }]}>인증사진 남기기</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: saving ? colors.mutedForeground : colors.primary,
              opacity: saving ? 0.7 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          <Ionicons name={saving ? 'hourglass-outline' : 'save-outline'} size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '기록 저장'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  goHome: { padding: 12 },

  // Entry phase
  successSection: { alignItems: 'center', marginBottom: 32, gap: 8 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  successTitle: { fontSize: 28, fontWeight: '800' },
  successSub: { fontSize: 15 },
  exCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24, gap: 4 },
  exCardLabel: { fontSize: 12, fontWeight: '600' },
  exCardTitle: { fontSize: 18, fontWeight: '800' },
  exCardGoal: { fontSize: 13 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: 'hidden',
  },
  stepper: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
  valueInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', height: 52 },
  unitText: { fontSize: 14, paddingHorizontal: 8 },
  memoInput: {
    borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  errorText: { fontSize: 14, flex: 1 },

  // Reward phase
  rewardTop: { alignItems: 'center', marginBottom: 24, gap: 12 },
  rewardIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  rewardHeadline: { fontSize: 22, fontWeight: '800' },
  rewardCard: {
    borderRadius: 12, borderWidth: 1, padding: 16,
    alignItems: 'center', gap: 8, width: '100%',
  },
  rewardExName: { fontSize: 17, fontWeight: '700' },
  diffBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  diffBadgeText: { fontSize: 12, fontWeight: '700' },
  pointsBox: {
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4,
  },
  pointsEarned: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  totalPoints: { fontSize: 16, marginTop: 4 },

  levelCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: {
    color: '#FFFFFF', fontSize: 13, fontWeight: '800',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  levelName: { fontSize: 16, fontWeight: '700' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  levelHint: { fontSize: 13 },

  badgeBox: {
    borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 6, marginBottom: 12,
  },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeHeaderText: { fontSize: 15, fontWeight: '800' },
  badgeName: { fontSize: 14, fontWeight: '600', marginLeft: 24 },

  // Bottom bar
  bottom: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20,
    paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, borderWidth: 2, paddingVertical: 14,
  },
  photoBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  outlineBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, borderWidth: 2, paddingVertical: 14,
  },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
  fillBtn: {
    flex: 1.5, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 14,
  },
  fillBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
