import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { getRecommendedExercises } from '@/constants/exercises';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { Exercise } from '@/constants/types';

const DIFF_COLORS: Record<string, string> = {
  '쉬움': '#147A5A',
  '보통': '#F5A623',
  '어려움': '#C73532',
};

export default function RecommendationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedPosition, selectedMinutes, setExercise } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const recommended = useMemo(() => {
    if (!selectedPosition || !selectedMinutes) return [];
    return getRecommendedExercises(selectedPosition, selectedMinutes);
  }, [selectedPosition, selectedMinutes]);

  const isFallback = useMemo(() => {
    if (!selectedPosition || !selectedMinutes) return false;
    const strict = getRecommendedExercises(selectedPosition, selectedMinutes);
    // naive check: if duration > selected minutes, it's fallback
    return strict.some((ex) => ex.durationMinutes > selectedMinutes);
  }, [selectedPosition, selectedMinutes, recommended]);

  const handleSelect = (ex: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExercise(ex);
    router.push('/exercise/detail');
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        <View
          style={[
            styles.diffBadge,
            { backgroundColor: DIFF_COLORS[item.difficulty] + '22' },
          ]}
        >
          <Text style={[styles.diffText, { color: DIFF_COLORS[item.difficulty] }]}>
            {item.difficulty}
          </Text>
        </View>
      </View>
      <Text style={[styles.summary, { color: colors.textSecondary }]}>{item.summary}</Text>
      <View style={styles.meta}>
        <View style={[styles.metaTag, { backgroundColor: colors.secondary }]}>
          <Ionicons name="body-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.bodyPart}</Text>
        </View>
        <View style={[styles.metaTag, { backgroundColor: colors.secondary }]}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {item.durationMinutes}분
          </Text>
        </View>
        <View style={[styles.metaTag, { backgroundColor: colors.secondary }]}>
          <Ionicons name="trophy-outline" size={13} color={colors.accent} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {item.targetValue}{item.targetUnit}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.ctaText, { color: colors.primary }]}>상세 보기</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );

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
        <View style={styles.stepWrap}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                { backgroundColor: s <= 3 ? colors.accent : colors.border },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={recommended}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingTop: 24, paddingBottom: botPad + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.title, { color: colors.primary }]}>맞춤 운동 추천</Text>
            <View style={styles.condRow}>
              <View style={[styles.condTag, { backgroundColor: colors.primaryDark ?? colors.primary }]}>
                <Text style={styles.condText}>{selectedPosition}</Text>
              </View>
              <View style={[styles.condTag, { backgroundColor: colors.accent }]}>
                <Text style={styles.condText}>{selectedMinutes}분 이내</Text>
              </View>
            </View>
            {isFallback && (
              <View style={[styles.fallbackNote, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
                  조건에 맞는 운동이 없어서 가장 짧은 운동을 보여드려요
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              추천 운동을 찾는 중이에요
            </Text>
          </View>
        }
      />
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
  stepWrap: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  list: { paddingHorizontal: 20 },
  listHeader: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  condRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  condTag: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  condText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  fallbackNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  fallbackText: { fontSize: 12, flex: 1, lineHeight: 18 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  diffBadge: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, marginLeft: 8 },
  diffText: { fontSize: 11, fontWeight: '700' },
  summary: { fontSize: 13, marginBottom: 12 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  metaText: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  ctaText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
});
