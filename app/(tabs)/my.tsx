import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useColors } from '@/hooks/useColors';
import { Button, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';

const PROVIDER_LABEL = { guest: '로그인하지 않았어요', kakao: '카카오로 로그인', google: '구글로 로그인' } as const;

function Row({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.sub, { color: colors.textSecondary }]}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function MyScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { settings } = useStore();
  const n = settings.notification;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>마이</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Ionicons name="person" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text, flex: 1 }]}>
              {PROVIDER_LABEL[settings.account.provider]}
            </Text>
          </View>
          {settings.account.provider === 'guest' ? (
            <Button label="로그인" variant="outline" onPress={() => router.push('/login')} />
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>나의 목표</Text>
          <Text style={[styles.goal, { color: colors.primary }]}>하루 1분</Text>
        </View>

        <Row
          icon="notifications-outline"
          label="알림 설정"
          sub={n.enabled ? `${n.startHour}시 ~ ${n.endHour}시 · 1시간마다` : '꺼짐'}
          onPress={() => router.push('/my/notifications')}
        />
        <Row icon="person-circle-outline" label="계정·탈퇴" onPress={() => router.push('/my/account')} />
        {__DEV__ ? (
          <Row icon="stats-chart-outline" label="개발용 지표 확인" sub="기기 안 데이터로 계산" onPress={() => router.push('/dev/metrics')} />
        ) : null}

        <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            JUST MOVE의 운동은 일반적인 생활체육 콘텐츠이며 의료 진단이나 치료를 대신하지 않아요.
            통증이나 어지러움이 느껴지면 즉시 멈추고, 질환이 있다면 운동 전에 전문가와 상담해 주세요.
          </Text>
        </View>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>버전 {version}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  goal: { fontSize: 28, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 64 },
  rowLabel: { fontSize: 17, fontWeight: '700' },
  sub: { fontSize: 14, lineHeight: 20 },
  notice: { borderRadius: 14, padding: 14, marginTop: 4 },
  version: { textAlign: 'center', fontSize: 13, marginTop: 4 },
});
