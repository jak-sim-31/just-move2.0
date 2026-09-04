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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const POSITIONS = [
  {
    key: '누워있다',
    icon: 'bed-outline',
    lib: 'Ionicons',
    desc: '침대·소파에 누운 상태',
    color: '#5B8DB8',
    bg: '#EBF3FB',
  },
  {
    key: '앉아있다',
    icon: 'seat-passenger',
    lib: 'MCI',
    desc: '의자·바닥에 앉은 상태',
    color: '#7B68EE',
    bg: '#F0EEFF',
  },
  {
    key: '서있다',
    icon: 'person-outline',
    lib: 'Ionicons',
    desc: '서 있거나 서기 가능한 상태',
    color: '#20B2AA',
    bg: '#E6F7F6',
  },
  {
    key: '걷고 있다',
    icon: 'walk',
    lib: 'MCI',
    desc: '산책·이동 중인 상태',
    color: '#F5A623',
    bg: '#FEF5E7',
  },
] as const;

export default function PositionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedPosition, setPosition } = useApp();
  const [selected, setSelected] = useState<string | null>(selectedPosition);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSelect = (pos: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(pos);
  };

  const handleNext = () => {
    if (!selected) return;
    setPosition(selected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/exercise/time');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header */}
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
                { backgroundColor: s === 1 ? colors.accent : colors.border },
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
        <Text style={[styles.title, { color: colors.primary }]}>지금 어떤 자세예요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          현재 상태에 맞는 운동을 골라드려요
        </Text>

        <View style={styles.cards}>
          {POSITIONS.map((p) => {
            const isSelected = selected === p.key;
            return (
              <Pressable
                key={p.key}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                onPress={() => handleSelect(p.key)}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : p.bg },
                  ]}
                >
                  {p.lib === 'Ionicons' ? (
                    <Ionicons
                      name={p.icon as any}
                      size={32}
                      color={isSelected ? '#FFFFFF' : p.color}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={p.icon as any}
                      size={32}
                      color={isSelected ? '#FFFFFF' : p.color}
                    />
                  )}
                </View>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {p.key}
                  </Text>
                  <Text
                    style={[
                      styles.cardDesc,
                      { color: isSelected ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
                    ]}
                  >
                    {p.desc}
                  </Text>
                </View>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                  size={22}
                  color={isSelected ? '#FFFFFF' : colors.border}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom button */}
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
              backgroundColor: selected ? colors.primary : colors.muted,
              transform: [{ scale: pressed && selected ? 0.97 : 1 }],
            },
          ]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text
            style={[
              styles.nextBtnText,
              { color: selected ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            다음
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={selected ? '#FFFFFF' : colors.textSecondary}
          />
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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardDesc: { fontSize: 13, marginTop: 2 },
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
  },
  nextBtnText: { fontSize: 17, fontWeight: '700' },
});
