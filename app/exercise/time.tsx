import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { ScreenHeader, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { POSTURE_LABEL, type Posture } from '@/lib/types';

const TIMES: { min: 1 | 3 | 5; desc: string }[] = [
  { min: 1, desc: '동작 1개' },
  { min: 3, desc: '동작 3개' },
  { min: 5, desc: '동작 5개' },
];

const isPosture = (v: unknown): v is Posture =>
  v === 'lying' || v === 'sitting' || v === 'standing' || v === 'walking';

export default function TimeScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { startSession } = useStore();
  const params = useLocalSearchParams<{ posture?: string }>();
  const posture = isPosture(params.posture) ? params.posture : null;

  const choose = (min: 1 | 3 | 5) => {
    if (!posture) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(posture, min);
    router.replace('/exercise/play');
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/exercise/position'));

  if (!posture) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader onBack={goBack} />
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          자세를 먼저 골라 주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader onBack={goBack} title={POSTURE_LABEL[posture]} />
      <View style={[styles.body, { paddingBottom: pad.bottom + 32 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>얼마나 시간이 있어요?</Text>
        <View style={styles.buttons}>
          {TIMES.map((t) => (
            <Pressable
              key={t.min}
              accessibilityRole="button"
              accessibilityLabel={`${t.min}분`}
              onPress={() => choose(t.min)}
              style={({ pressed }) => [
                styles.timeBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={[styles.timeNum, { color: colors.primary }]}>{t.min}분</Text>
              <Text style={[styles.timeDesc, { color: colors.textSecondary }]}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 24 },
  buttons: { gap: 14 },
  timeBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 96,
  },
  timeNum: { fontSize: 34, fontWeight: '800' },
  timeDesc: { fontSize: 16 },
  empty: { fontSize: 16, textAlign: 'center', marginTop: 40 },
});
