import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ScreenHeader, useScreenPad } from '@/components/ui';
import { diffDays, todayKey } from '@/lib/date';
import { userMetrics } from '@/lib/metrics';
import { movedDateKeys } from '@/lib/stats';
import { useStore } from '@/store/AppStore';

/**
 * 개발용 지표 확인 화면 (일반 사용자에게는 보이지 않는다).
 * 이 기기의 사용자 한 명을 기준으로 검증 지표를 계산해 보여 준다.
 * 베타 단계에서는 서버의 사용자별 계산값을 모아 관리자 대시보드로 대체한다.
 */
function Line({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.line}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function DevMetrics() {
  const colors = useColors();
  const pad = useScreenPad();
  const { sessions, settings } = useStore();
  const today = todayKey();
  const moved = movedDateKeys(sessions);
  const m = userMetrics(moved, settings.firstUseDate, today);
  const under1 = sessions.filter((s) => s.creditedMin === 0).length;
  const yn = (b: boolean) => (b ? '예' : '아니오');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="개발용 지표" onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my'))} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 32 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h, { color: colors.text }]}>기본</Text>
          <Line label="첫 사용일" value={settings.firstUseDate} />
          <Line label="사용 일수" value={`${diffDays(settings.firstUseDate, today) + 1}일째`} />
          <Line label="운동한 날 (누적)" value={`${moved.length}일`} />
          <Line label="1분 미만으로 끝난 시도" value={`${under1}회`} />
          <Line label="첫날 운동" value={yn(m.day1Moved)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h, { color: colors.text }]}>7일 (D0~D6)</Text>
          <Line label="기간 종료" value={yn(m.week1Complete)} />
          <Line label="운동한 날" value={`${m.movedDaysIn7}/7일`} />
          <Line label="매일 운동" value={yn(m.movedEveryDayIn7)} />
          <Line label="쉬었다 돌아온 횟수" value={`${m.returnsIn7.length}회`} />
          {m.returnsIn7.map((r) => (
            <Line key={r.to} label={`· ${r.from} → ${r.to}`} value={`${r.restDays}일 쉼 (${r.bucket === '3+' ? '3일 이상' : r.bucket + '일'})`} />
          ))}
          <Line label="7일 성공 사용자" value={yn(m.week1Success)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.h, { color: colors.text }]}>14일 (D0~D13)</Text>
          <Line label="기간 종료" value={yn(m.fortnightComplete)} />
          <Line label="운동한 날" value={`${m.movedDaysIn14}/14일`} />
          <Line label="참여 유지 (마지막 3일 중 1회)" value={yn(m.retainedLast3Of14)} />
          <Line label="운동 실천 (7일 이상)" value={yn(m.practiced7of14)} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  h: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 14, flex: 1 },
  value: { fontSize: 14, fontWeight: '700' },
});
