import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { FlowHeader, PostureCards, useLegacyPad } from '@/components/Legacy';
import { useStore } from '@/store/AppStore';
import type { Posture } from '@/lib/types';

/** M-01 자세 선택 — 수정 전 자세 선택 화면 모양, 카드를 누르면 바로 시간 선택 */
export default function PositionScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { settings } = useStore();

  const choose = (posture: Posture) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/exercise/time', params: { posture } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlowHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        step={1}
        totalSteps={2}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>지금 어떤 자세예요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          현재 상태에 맞는 운동을 골라드려요
        </Text>
        <PostureCards onSelect={choose} lastPosture={settings.lastPosture} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 28 },
});
