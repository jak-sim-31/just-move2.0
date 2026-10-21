import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { BottomBar, useLegacyPad } from '@/components/Legacy';
import { PERCEIVED_COLORS, PerceivedChip } from '@/components/StatsUI';
import { Button } from '@/components/ui';
import { exerciseById } from '@/data/content';
import { appConfig } from '@/lib/config';
import { badges, rewardLevel, totalPoints } from '@/lib/rewards';
import { movedDateKeys } from '@/lib/stats';
import { todayKey } from '@/lib/date';
import { PERCEIVED_LABEL, type Perceived } from '@/lib/types';
import { useStore } from '@/store/AppStore';

/**
 * M-04 운동 완료 — 수정 전 완료 화면의 2단계(입력 → 보상)를 유지한다.
 * 기록은 이 화면에 들어오는 순간 저장되어 있고, 입력 단계는 덧붙이는 정보(체감 난이도·횟수·메모)다.
 */
const PERCEIVED_ORDER: Perceived[] = ['light', 'fit', 'hard'];

export default function CompleteScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const params = useLocalSearchParams<{ id?: string; phase?: string }>();
  const {
    ready,
    sessions,
    settings,
    setPerceived,
    setSessionExtras,
    markLoginPromptShown,
    mockLogin,
  } = useStore();
  const session = sessions.find((s) => s.id === params.id);
  const [phase, setPhase] = useState<'entry' | 'reward'>(params.phase === 'reward' ? 'reward' : 'entry');
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [memo, setMemo] = useState('');
  const [sheet, setSheet] = useState(false);

  const played = useMemo(() => {
    if (!session) return [];
    const ids = session.items.filter((it) => !it.skipped && it.playedSec > 0).map((it) => it.exerciseId);
    return [...new Set(ids)].map((id) => exerciseById(id)).filter((e): e is NonNullable<typeof e> => !!e);
  }, [session]);

  useEffect(() => {
    if (session && session.creditedMin >= 1 && phase === 'entry') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [session, phase]);

  const shouldAskLogin =
    phase === 'reward' && !!session && session.creditedMin >= 1 && !settings.loginPromptShown && settings.account.provider === 'guest';
  useEffect(() => {
    if (!shouldAskLogin) return;
    const t = setTimeout(() => setSheet(true), 900);
    return () => clearTimeout(t);
  }, [shouldAskLogin]);

  const goHome = () => router.replace('/(tabs)');

  if (!ready || !session) {
    return (
      <View style={[styles.container, styles.empty, { backgroundColor: colors.background }]}>
        {ready ? (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>완료할 운동이 없어요</Text>
            <Pressable onPress={goHome} style={styles.goHome}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>홈으로 가기</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  }

  // 1분 미만: 기록·보상 없이 격려만
  if (session.creditedMin === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 40 }]}>
          <View style={styles.successSection}>
            <View style={[styles.successIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="heart-outline" size={56} color={colors.primary} />
            </View>
            <Text style={[styles.rewardHeadline, { color: colors.text, textAlign: 'center' }]}>
              움직이려고 한 것만으로도 충분해요
            </Text>
            <Text style={[styles.successSub, { color: colors.textSecondary, textAlign: 'center' }]}>
              1분 이상 움직이면 기록과 물방울이 쌓여요.{'\n'}언제든 다시 해봐요.
            </Text>
          </View>
        </ScrollView>
        <BottomBar>
          <Pressable
            style={[styles.outlineBtn, { borderColor: colors.primary }]}
            onPress={goHome}
          >
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>홈으로</Text>
          </Pressable>
          <Pressable
            style={[styles.fillBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.replace('/exercise/position')}
          >
            <Text style={styles.fillBtnText}>다시 해보기</Text>
          </Pressable>
        </BottomBar>
      </View>
    );
  }

  const saveExtras = () => {
    const parsed: Record<string, number> = {};
    for (const [id, v] of Object.entries(counts)) {
      const n = Number(v);
      if (v !== '' && Number.isFinite(n)) parsed[id] = n;
    }
    setSessionExtras(session.id, {
      counts: Object.keys(parsed).length ? parsed : undefined,
      memo: memo.trim() || undefined,
    });
  };

  // ── 입력 단계 ──────────────────────────────────────────────
  if (phase === 'entry') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: 40 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.duration(500)} style={styles.successSection}>
              <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.success }]}>꼼지락 성공!</Text>
              <Text style={[styles.successSub, { color: colors.textSecondary }]}>오늘도 실제로 움직였어요</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.exCardLabel, { color: colors.textSecondary }]}>운동</Text>
                <Text style={[styles.exCardTitle, { color: colors.text }]}>
                  {played.map((e) => e.name).join(', ') || '운동'}
                </Text>
                <Text style={[styles.exCardGoal, { color: colors.textSecondary }]}>
                  {session.creditedMin}분 동안 함께했어요
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>오늘 운동은 어땠나요?</Text>
              <Text style={[styles.optional, { color: colors.textSecondary }]}>선택하지 않아도 괜찮아요</Text>
              <View style={styles.perceivedRow}>
                {PERCEIVED_ORDER.map((p) => {
                  const on = session.perceived === p;
                  const c = PERCEIVED_COLORS(colors)[p];
                  return (
                    <Pressable
                      key={p}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      onPress={() => setPerceived(session.id, on ? undefined : p)}
                      style={[
                        styles.perceived,
                        {
                          backgroundColor: on ? colors.primary : c.bg,
                          borderColor: on ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.perceivedText, { color: on ? '#FFFFFF' : c.fg }]}>
                        {PERCEIVED_LABEL[p]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>실제로 몇 번 했나요? (선택)</Text>
              {played.map((ex) => {
                const v = counts[ex.id] ?? '';
                const unit = ex.targetUnit;
                return (
                  <View key={ex.id} style={{ marginBottom: 12 }}>
                    <Text style={[styles.countName, { color: colors.textSecondary }]}>
                      {ex.name} · 목표 {ex.targetValue}
                      {unit}
                    </Text>
                    <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${ex.name} 횟수 줄이기`}
                        onPress={() =>
                          setCounts((c) => ({ ...c, [ex.id]: v === '' ? '' : String(Math.max(0, Number(v) - 1)) }))
                        }
                        style={[styles.stepper, { backgroundColor: colors.secondary }]}
                      >
                        <Ionicons name="remove" size={20} color={colors.primary} />
                      </Pressable>
                      <TextInput
                        value={v}
                        onChangeText={(t) => setCounts((c) => ({ ...c, [ex.id]: t.replace(/[^0-9]/g, '') }))}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.valueInput, { color: colors.text }]}
                        selectTextOnFocus
                        accessibilityLabel={`${ex.name} 실제 횟수`}
                      />
                      <Text style={[styles.unitText, { color: colors.textSecondary }]}>{unit.replace(/\s*\(.*\)/, '')}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${ex.name} 횟수 늘리기`}
                        onPress={() =>
                          setCounts((c) => ({ ...c, [ex.id]: v === '' ? String(ex.targetValue) : String(Number(v) + 1) }))
                        }
                        style={[styles.stepper, { backgroundColor: colors.secondary }]}
                      >
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 8 }]}>메모 (선택)</Text>
              <TextInput
                value={memo}
                onChangeText={setMemo}
                placeholder="오늘 느낀 점을 남겨보세요..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.memoInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                multiline
                numberOfLines={3}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomBar>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.photoBtn, { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              saveExtras();
              router.push({ pathname: '/exercise/photo', params: { id: session.id } });
            }}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={[styles.photoBtnText, { color: colors.primary }]}>인증사진 남기기</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              saveExtras();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPhase('reward');
            }}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>기록 저장</Text>
          </Pressable>
        </BottomBar>
      </View>
    );
  }

  // ── 보상 단계 ──────────────────────────────────────────────
  const today = todayKey();
  const before = sessions.filter((s) => s.id !== session.id);
  const beforeBadges = new Set(badges(movedDateKeys(before), today).filter((b) => b.unlocked).map((b) => b.id));
  const newBadges = badges(movedDateKeys(sessions), today).filter((b) => b.unlocked && !beforeBadges.has(b.id));
  const level = rewardLevel(totalPoints(sessions));
  const isMax = level.level === 5;
  const dropLimitReached = session.dropsEarned < session.creditedMin;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 24, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.rewardTop}>
          <View style={[styles.rewardIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.rewardHeadline, { color: colors.text }]}>오늘도 움직였어요!</Text>
          <View style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rewardExName, { color: colors.text }]} numberOfLines={2}>
              {played.map((e) => e.name).join(', ') || '운동'}
            </Text>
            {session.perceived ? <PerceivedChip value={session.perceived} /> : null}
            <View style={styles.rewardBoxes}>
              <View style={[styles.pointsBox, { backgroundColor: '#3B9AE1' }]}>
                <Ionicons name="water" size={18} color="#FFFFFF" />
                <Text style={styles.pointsEarned}>+{session.dropsEarned}</Text>
              </View>
              <View style={[styles.pointsBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.pointsEarned}>+{session.points ?? 0} MOVE</Text>
              </View>
            </View>
            {dropLimitReached ? (
              <Text style={[styles.totalPoints, { color: colors.textSecondary }]}>
                오늘 물방울은 다 모았어요 (하루 {appConfig.dropDailyLimit}개)
              </Text>
            ) : null}
            <Text style={[styles.totalPoints, { color: colors.textSecondary }]}>
              누적 <Text style={{ color: colors.primary, fontWeight: '800' }}>{level.totalPoints}</Text> MOVE
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <View style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.levelRow}>
              <Text style={[styles.levelBadge, { backgroundColor: colors.primary }]}>{'Lv.' + level.level}</Text>
              <Text style={[styles.levelName, { color: colors.text }]}>{level.levelName}</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${level.progressPct}%` }]} />
            </View>
            <Text style={[styles.levelHint, { color: colors.textSecondary }]}>
              {isMax ? '최고 레벨을 달성했어요 🎉' : `다음 레벨까지 ${(level.nextLevelPoints ?? 0) - level.totalPoints} MOVE 남음`}
            </Text>
          </View>

          {newBadges.length > 0 ? (
            <View style={[styles.badgeBox, { backgroundColor: '#FFF8E7', borderColor: colors.accent }]}>
              <View style={styles.badgeHeader}>
                <Ionicons name="trophy" size={18} color={colors.accent} />
                <Text style={[styles.badgeHeaderText, { color: colors.text }]}>새 배지 획득!</Text>
              </View>
              {newBadges.map((b) => (
                <Text key={b.id} style={[styles.badgeName, { color: colors.text }]}>
                  {b.name}
                </Text>
              ))}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" onPress={goHome} style={styles.homeLink}>
            <Text style={[styles.homeLinkText, { color: colors.textSecondary }]}>홈으로</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <BottomBar>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.outlineBtn, { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.replace('/(tabs)/records')}
        >
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>기록 보기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.fillBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.replace('/(tabs)/farm')}
        >
          <Ionicons name="water" size={18} color="#FFFFFF" />
          <Text style={styles.fillBtnText}>농장 가기</Text>
        </Pressable>
      </BottomBar>

      <Modal
        visible={sheet}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSheet(false);
          markLoginPromptShown();
        }}
      >
        <View style={styles.modalBack}>
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: pad.bottom + 20 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>기록과 작물을 잃지 않도록 저장해 둘까요?</Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              로그인하면 지금까지의 운동 기록이 그대로 이어져요.
            </Text>
            <Button
              label="카카오로 계속"
              variant="ghost"
              style={{ backgroundColor: '#FEE500' }}
              onPress={() => {
                mockLogin('kakao');
                setSheet(false);
                markLoginPromptShown();
              }}
            />
            <Button
              label="구글로 계속"
              variant="outline"
              onPress={() => {
                mockLogin('google');
                setSheet(false);
                markLoginPromptShown();
              }}
            />
            <Button
              label="나중에 하기"
              variant="ghost"
              onPress={() => {
                setSheet(false);
                markLoginPromptShown();
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  goHome: { padding: 12 },
  successSection: { alignItems: 'center', marginBottom: 32, gap: 8 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 28, fontWeight: '800' },
  successSub: { fontSize: 15, lineHeight: 22 },
  exCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24, gap: 4 },
  exCardLabel: { fontSize: 12, fontWeight: '600' },
  exCardTitle: { fontSize: 18, fontWeight: '800' },
  exCardGoal: { fontSize: 13 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  optional: { fontSize: 12, marginTop: -4, marginBottom: 8 },
  perceivedRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  perceived: { flex: 1, minHeight: 44, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  perceivedText: { fontSize: 13, fontWeight: '700' },
  countName: { fontSize: 12, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  stepper: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
  valueInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', height: 52 },
  unitText: { fontSize: 14, paddingHorizontal: 8 },
  memoInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  rewardTop: { alignItems: 'center', marginBottom: 24, gap: 12 },
  rewardIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  rewardHeadline: { fontSize: 22, fontWeight: '800' },
  rewardCard: { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8, width: '100%' },
  rewardExName: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  rewardBoxes: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pointsBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  pointsEarned: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  totalPoints: { fontSize: 14, marginTop: 2 },
  levelCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelName: { fontSize: 16, fontWeight: '700' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  levelHint: { fontSize: 13 },
  badgeBox: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 6, marginBottom: 12 },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeHeaderText: { fontSize: 15, fontWeight: '800' },
  badgeName: { fontSize: 14, fontWeight: '600', marginLeft: 24 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
  },
  photoBtnText: { fontSize: 14, fontWeight: '700' },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  outlineBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2, paddingVertical: 14 },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
  fillBtn: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
  fillBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  homeLink: { alignItems: 'center', paddingTop: 0 },
  homeLinkText: { fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetSub: { fontSize: 15, marginBottom: 4 },
});
