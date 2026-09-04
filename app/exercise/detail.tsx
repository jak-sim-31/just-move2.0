import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const DIFF_COLORS: Record<string, string> = {
  '쉬움': '#147A5A',
  '보통': '#F5A623',
  '어려움': '#C73532',
};

export default function DetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedExercise, selectedPosition, setMinutes } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!selectedExercise) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            운동을 선택해주세요
          </Text>
        </View>
      </View>
    );
  }

  const ex = selectedExercise;

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/exercise/video');
  };

  const handleSchedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/schedule');
  };

  const steps = ex.detailContent.split('\n');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          운동 상세
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Video preview placeholder */}
        <Pressable
          style={[styles.thumbContainer, { backgroundColor: colors.primary }]}
          onPress={handleStart}
        >
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={28} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.thumbLabel}>영상 보기</Text>
        </Pressable>

        <View style={styles.body}>
          {/* Title & badges */}
          <Text style={[styles.title, { color: colors.text }]}>{ex.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: DIFF_COLORS[ex.difficulty] + '22' }]}>
              <Text style={[styles.badgeText, { color: DIFF_COLORS[ex.difficulty] }]}>
                {ex.difficulty}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Ionicons name="body-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{ex.bodyPart}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {ex.durationMinutes}분
              </Text>
            </View>
            {ex.equipment !== '없음' && ex.equipment !== '없음 (매트 권장)' ? (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="construct-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{ex.equipment}</Text>
              </View>
            ) : null}
          </View>

          {/* Goal */}
          <View style={[styles.goalBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.goalLabel}>목표</Text>
            <Text style={styles.goalValue}>
              {ex.targetValue} {ex.targetUnit}
            </Text>
          </View>

          {/* Steps */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>운동 방법</Text>
          <View style={[styles.stepsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {steps.map((step, i) => (
              <View key={i} style={[styles.stepRow, i < steps.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Caution */}
          <View style={[styles.cautionBox, { backgroundColor: '#FEF5E7', borderColor: '#F5A623' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.accent} />
            <View style={styles.cautionContent}>
              <Text style={[styles.cautionTitle, { color: colors.accent }]}>주의사항</Text>
              <Text style={[styles.cautionText, { color: colors.text }]}>{ex.caution}</Text>
            </View>
          </View>

          {/* YouTube link */}
          <Pressable
            style={styles.ytLink}
            onPress={() => Linking.openURL(ex.youtubeUrl)}
          >
            <Ionicons name="logo-youtube" size={16} color="#FF0000" />
            <Text style={[styles.ytLinkText, { color: colors.textSecondary }]}>
              유튜브에서 영상 보기
            </Text>
          </Pressable>
        </View>
      </ScrollView>

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
            styles.schedBtn,
            {
              borderColor: colors.primary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
          onPress={handleSchedule}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.schedBtnText, { color: colors.primary }]}>시간 정하기</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            {
              backgroundColor: colors.accent,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: colors.accent,
            },
          ]}
          onPress={handleStart}
        >
          <Ionicons name="flash" size={18} color="#FFFFFF" />
          <Text style={styles.startBtnText}>지금 움직이기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  thumbContainer: {
    height: 200, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbLabel: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700',
    marginTop: 8,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  goalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  goalValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  stepsBox: { borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  stepRow: { padding: 14 },
  stepText: { fontSize: 14, lineHeight: 22 },
  cautionBox: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  cautionContent: { flex: 1 },
  cautionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cautionText: { fontSize: 13, lineHeight: 20 },
  ytLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  ytLinkText: { fontSize: 13, textDecorationLine: 'underline' },
  bottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  schedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
  },
  schedBtnText: { fontSize: 15, fontWeight: '700' },
  startBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  startBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16 },
});
