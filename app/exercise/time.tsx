import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FlowHeader, useLegacyPad } from '@/components/Legacy';
import { useStore } from '@/store/AppStore';
import { POSTURE_LABEL, type Posture } from '@/lib/types';

/** M-02 시간 선택 — 수정 전 시간 선택 화면 모양 (10분 제거, 누르면 바로 영상) */
const TIME_OPTIONS: { minutes: 1 | 3 | 5; label: string; desc: string; icon: string }[] = [
  { minutes: 1, label: '1분', desc: '동작 1개', icon: 'flash-outline' },
  { minutes: 3, label: '3분', desc: '동작 3개 이어서', icon: 'walk-outline' },
  { minutes: 5, label: '5분', desc: '동작 5개 이어서', icon: 'body-outline' },
];

const isPosture = (v: unknown): v is Posture =>
  v === 'lying' || v === 'sitting' || v === 'standing' || v === 'walking';

export default function TimeScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { startSession } = useStore();
  const params = useLocalSearchParams<{ posture?: string }>();
  const posture = isPosture(params.posture) ? params.posture : null;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/exercise/position'));

  const choose = (min: 1 | 3 | 5) => {
    if (!posture) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(posture, min);
    router.replace('/exercise/play');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlowHeader onBack={goBack} step={2} totalSteps={2} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {posture ? (
          <View style={[styles.breadcrumb, { backgroundColor: colors.secondary }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.breadcrumbText, { color: colors.text }]}>{POSTURE_LABEL[posture]}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, { color: colors.primary }]}>얼마나 시간이 있어요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          무리하지 않아도 돼요. 1분도 충분해요.
        </Text>
        {posture ? (
          <View style={styles.grid}>
            {TIME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.minutes}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => choose(opt.minutes)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: pressed ? colors.primary : colors.card,
                    borderColor: pressed ? colors.primary : colors.border,
                    borderWidth: pressed ? 2 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                {({ pressed }) => (
                  <>
                    <Ionicons
                      name={opt.icon as never}
                      size={28}
                      color={pressed ? colors.accent : colors.textSecondary}
                    />
                    <Text style={[styles.cardLabel, { color: pressed ? '#FFFFFF' : colors.text }]}>
                      {opt.label}
                    </Text>
                    <Text
                      style={[styles.cardDesc, { color: pressed ? 'rgba(255,255,255,0.75)' : colors.textSecondary }]}
                    >
                      {opt.desc}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>자세를 먼저 골라 주세요.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  breadcrumbText: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    minHeight: 130,
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  cardDesc: { fontSize: 12, textAlign: 'center' },
});
