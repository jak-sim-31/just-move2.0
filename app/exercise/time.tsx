import React, { useState } from 'react';
import {
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

const TIME_OPTIONS = [
  { minutes: 1, label: '1분', desc: '스트레칭 1~2가지', icon: 'flash-outline' },
  { minutes: 3, label: '3분', desc: '가벼운 운동 1가지', icon: 'walk-outline' },
  { minutes: 5, label: '5분', desc: '운동 1~2가지', icon: 'body-outline' },
  { minutes: 10, label: '10분', desc: '운동 루틴 완성', icon: 'flame-outline' },
] as const;

export default function TimeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedPosition, selectedMinutes, setMinutes } = useApp();
  const [selected, setSelected] = useState<number | null>(selectedMinutes);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSelect = (min: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(min);
  };

  const handleNext = () => {
    if (!selected) return;
    setMinutes(selected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/exercise/recommendations');
  };

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
                { backgroundColor: s <= 2 ? colors.accent : colors.border },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {selectedPosition && (
          <View style={[styles.breadcrumb, { backgroundColor: colors.secondary }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.breadcrumbText, { color: colors.text }]}>
              {selectedPosition}
            </Text>
          </View>
        )}

        <Text style={[styles.title, { color: colors.primary }]}>얼마나 시간이 있어요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          무리하지 않아도 돼요. 1분도 충분해요.
        </Text>

        <View style={styles.grid}>
          {TIME_OPTIONS.map((opt) => {
            const isSelected = selected === opt.minutes;
            return (
              <Pressable
                key={opt.minutes}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
                onPress={() => handleSelect(opt.minutes)}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={28}
                  color={isSelected ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.cardLabel,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.cardDesc,
                    { color: isSelected ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                  ]}
                >
                  {opt.desc}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

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
            styles.nextBtn,
            {
              backgroundColor: selected ? colors.accent : colors.muted,
              transform: [{ scale: pressed && selected ? 0.97 : 1 }],
              shadowColor: selected ? colors.accent : 'transparent',
            },
          ]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={selected ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.nextBtnText,
              { color: selected ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            운동 추천받기
          </Text>
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
  stepWrap: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
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
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: { fontSize: 17, fontWeight: '700' },
});
