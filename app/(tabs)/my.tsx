import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLegacyPad } from '@/components/Legacy';
import { badges as calcBadges, rewardLevel, totalPoints, type BadgeInfo } from '@/lib/rewards';
import { todayKey } from '@/lib/date';
import { movedDateKeys } from '@/lib/stats';
import { useStore } from '@/store/AppStore';

/**
 * P-01 MY — 수정 전 MY 탭(나의 MOVE, 배지, 통계 보기)을 유지하고
 * 기획서 요소(고정 목표 "하루 1분", 알림 설정, 계정·탈퇴)를 더했다.
 */

const PROVIDER_LABEL = { guest: '로그인하지 않았어요', kakao: '카카오로 로그인됨', google: '구글로 로그인됨' } as const;

function BadgeCard({ badge }: { badge: BadgeInfo }) {
  const colors = useColors();
  const locked = !badge.unlocked;
  return (
    <View
      style={[
        badgeStyles.card,
        { backgroundColor: locked ? colors.muted : colors.card, borderColor: locked ? colors.border : colors.primary },
      ]}
    >
      <View style={[badgeStyles.iconWrap, { backgroundColor: locked ? colors.secondary : '#FFF8E7' }]}>
        <Ionicons name={locked ? 'lock-closed-outline' : 'trophy'} size={22} color={locked ? colors.textSecondary : colors.accent} />
      </View>
      <View style={badgeStyles.info}>
        <Text style={[badgeStyles.name, { color: locked ? colors.textSecondary : colors.text }]}>{badge.name}</Text>
        <Text style={[badgeStyles.cond, { color: colors.textSecondary }]}>
          {badge.unlocked ? badge.condition : badge.currentProgress ?? badge.condition}
        </Text>
      </View>
    </View>
  );
}

function NavBtn({ icon, label, sub, onPress }: { icon: string; label: string; sub?: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        navStyles.btn,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Ionicons name={icon as never} size={20} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[navStyles.label, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[navStyles.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function MyScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { sessions, settings, schedules } = useStore();
  const level = useMemo(() => rewardLevel(totalPoints(sessions)), [sessions]);
  const badges = useMemo(() => calcBadges(movedDateKeys(sessions), todayKey()), [sessions]);
  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);
  const isMax = level.level === 5;
  const n = settings.notification;
  const activeSchedules = schedules.filter((s) => s.status === 'scheduled').length;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.primary }]}>MY</Text>

      {/* 계정 */}
      <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Ionicons name="person" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.accountText, { color: colors.text }]}>{PROVIDER_LABEL[settings.account.provider]}</Text>
        {settings.account.provider === 'guest' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={[styles.loginBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.loginText, { color: colors.primary }]}>로그인</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 나의 MOVE */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>나의 MOVE</Text>
      <View style={[styles.levelCard, { backgroundColor: colors.primary }]}>
        <View style={styles.levelTopRow}>
          <View>
            <Text style={styles.levelBadgeText}>Level {level.level}</Text>
            <Text style={styles.levelName}>{level.levelName}</Text>
          </View>
          <View style={styles.moveBox}>
            <Text style={styles.moveNum}>{level.totalPoints}</Text>
            <Text style={styles.moveLabel}>MOVE</Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${level.progressPct}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={styles.levelHint}>
          {isMax ? '최고 레벨을 달성했어요 🎉' : `다음 레벨까지 ${(level.nextLevelPoints ?? 0) - level.totalPoints} MOVE 남음`}
        </Text>
      </View>

      {/* 나의 목표 (고정) */}
      <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="flag-outline" size={20} color={colors.accent} />
        <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>나의 목표</Text>
        <Text style={[styles.goalValue, { color: colors.primary }]}>하루 1분</Text>
      </View>

      {/* 배지 */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>획득한 배지</Text>
      {unlocked.length === 0 ? (
        <View style={[styles.emptyBadge, { backgroundColor: colors.secondary }]}>
          <Ionicons name="trophy-outline" size={28} color={colors.textSecondary} />
          <Text style={[styles.emptyBadgeText, { color: colors.textSecondary }]}>
            아직 획득한 배지가 없어요. 운동을 완료하면 첫 배지를 받아요!
          </Text>
        </View>
      ) : (
        unlocked.map((b) => <BadgeCard key={b.id} badge={b} />)
      )}
      {locked.length > 0 ? (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>잠긴 배지</Text>
          {locked.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </>
      ) : null}

      {/* 통계 보기 */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>통계 보기</Text>
      <NavBtn
        icon="bar-chart-outline"
        label="주간 통계 보기"
        onPress={() => router.push({ pathname: '/(tabs)/records', params: { tab: '주간 통계' } })}
      />
      <NavBtn
        icon="calendar-outline"
        label="월간 통계 보기"
        onPress={() => router.push({ pathname: '/(tabs)/records', params: { tab: '월간 통계' } })}
      />

      {/* 설정 */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>설정</Text>
      <NavBtn
        icon="notifications-outline"
        label="알림 설정"
        sub={n.enabled ? `${n.startHour}시 ~ ${n.endHour}시 · 매시 정각` : '꺼짐'}
        onPress={() => router.push('/my/notifications')}
      />
      <NavBtn
        icon="calendar-number-outline"
        label="운동 예약"
        sub={activeSchedules > 0 ? `예약 ${activeSchedules}개` : '예약한 운동이 없어요'}
        onPress={() => router.push('/my/schedules')}
      />
      <NavBtn icon="person-circle-outline" label="계정·탈퇴" onPress={() => router.push('/my/account')} />
      {__DEV__ ? (
        <NavBtn icon="stats-chart-outline" label="개발용 지표 확인" sub="기기 안 데이터로 계산" onPress={() => router.push('/dev/metrics')} />
      ) : null}

      <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
          JUST MOVE의 운동 추천은 일반적인 생활체육 콘텐츠이며 의료 진단이나 치료를 대신하지 않아요. 통증이나
          질환이 있다면 운동 전 전문가와 상담해 주세요.
        </Text>
      </View>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>버전 {version}</Text>
    </ScrollView>
  );
}

const badgeStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 12, marginBottom: 8 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  cond: { fontSize: 12, marginTop: 2 },
});

const navStyles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 24 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  accountText: { flex: 1, fontSize: 15, fontWeight: '600' },
  loginBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  loginText: { fontSize: 13, fontWeight: '700' },
  levelCard: { borderRadius: 16, padding: 20, gap: 12 },
  levelTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadgeText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  levelName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  moveBox: { alignItems: 'flex-end' },
  moveNum: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', lineHeight: 36 },
  moveLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  levelHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 12 },
  goalLabel: { fontSize: 13, flex: 1 },
  goalValue: { fontSize: 17, fontWeight: '800' },
  emptyBadge: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  emptyBadgeText: { flex: 1, fontSize: 13, lineHeight: 20 },
  notice: { borderRadius: 12, padding: 14, marginTop: 16 },
  noticeText: { fontSize: 12, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 12 },
});
