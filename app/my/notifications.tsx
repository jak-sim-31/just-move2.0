import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button, ScreenHeader, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';

function hourLabel(h: number): string {
  const ap = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}시`;
}

function HourPicker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (h: number) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 한 시간 앞으로`}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          style={[styles.stepBtn, { opacity: value <= min ? 0.3 : 1 }]}
        >
          <Ionicons name="remove" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.value, { color: colors.text }]}>{hourLabel(value)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} 한 시간 뒤로`}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          style={[styles.stepBtn, { opacity: value >= max ? 0.3 : 1 }]}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function NotificationSettings() {
  const colors = useColors();
  const pad = useScreenPad();
  const { settings, setNotification } = useStore();
  const [enabled, setEnabled] = useState(settings.notification.enabled);
  const [start, setStart] = useState(settings.notification.startHour);
  const [end, setEnd] = useState(settings.notification.endHour);
  const [saved, setSaved] = useState(false);
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  const toggle = async (on: boolean) => {
    setEnabled(on);
    setSaved(false);
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        setPermission(await Notification.requestPermission());
      } catch {
        // 지원하지 않는 브라우저
      }
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my'));

  const save = () => {
    setNotification({ enabled, startHour: start, endHour: Math.max(start, end) });
    setSaved(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="알림 설정" onBack={goBack} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 32 }]}>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>알림 받기</Text>
          <Switch
            accessibilityLabel="알림 켜기 또는 끄기"
            value={enabled}
            onValueChange={toggle}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>

        {enabled ? (
          <>
            <HourPicker label="시작 시간" value={start} min={0} max={end} onChange={(h) => { setStart(h); setSaved(false); }} />
            <HourPicker label="종료 시간" value={end} min={start} max={23} onChange={(h) => { setEnd(h); setSaved(false); }} />
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>간격</Text>
              <Text style={[styles.value, { color: colors.textSecondary }]}>1시간마다 (정각)</Text>
            </View>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              오늘 물방울 5개를 모두 받으면 그날의 알림은 멈춰요.
            </Text>
          </>
        ) : null}

        {permission === 'denied' ? (
          <Text style={[styles.note, { color: '#B45309' }]}>
            브라우저에서 알림이 차단되어 있어요. 브라우저 설정에서 허용해 주세요.
          </Text>
        ) : null}

        <View style={[styles.info, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            {Platform.OS === 'web'
              ? '앱을 열어 둔 동안에는 정각에 안내가 나타나요. 앱을 닫아도 알림을 받으려면 정식 서비스에서 지원할 예정이에요. iPhone에서는 홈 화면에 추가한 뒤에만 알림을 받을 수 있어요.'
              : '알림을 받으려면 휴대폰 설정에서 알림을 허용해 주세요.'}
          </Text>
        </View>

        <Button label={saved ? '저장했어요' : '저장'} onPress={save} disabled={saved} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, padding: 16, minHeight: 64 },
  label: { fontSize: 17, fontWeight: '700' },
  value: { fontSize: 16, fontWeight: '600', minWidth: 90, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 14, lineHeight: 21 },
  info: { borderRadius: 14, padding: 14 },
});
