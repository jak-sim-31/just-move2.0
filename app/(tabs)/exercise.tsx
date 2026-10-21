import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { PostureCards, useLegacyPad } from '@/components/Legacy';
import { useStore } from '@/store/AppStore';
import type { Posture } from '@/lib/types';

/** 운동 탭 — 수정 전 운동 탭 그대로 (자세를 고르면 시간 선택으로) */
export default function ExerciseTab() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { settings } = useStore();

  const choose = (posture: Posture) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/exercise/time', params: { posture } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pad.top + 16, paddingBottom: pad.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>지금 어떤 자세예요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          현재 상태에 맞는 운동을 바로 추천해 드려요
        </Text>
        <PostureCards onSelect={choose} lastPosture={settings.lastPosture} />
        <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            지금 자세에서 바로 시작할 수 있는 운동만 추천해요
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 24,
  },
  noticeText: { fontSize: 13, flex: 1 },
});
