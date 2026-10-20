import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { ScreenHeader, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { POSTURE_LABEL, type Posture } from '@/lib/types';

const POSTURES: {
  key: Posture;
  desc: string;
  color: string;
  bg: string;
  render: (color: string) => React.ReactNode;
}[] = [
  {
    key: 'lying',
    desc: '침대·소파·바닥에 누운 채로',
    color: '#5B8DB8',
    bg: '#EBF3FB',
    render: (c) => <Ionicons name="bed-outline" size={34} color={c} />,
  },
  {
    key: 'sitting',
    desc: '의자, 차 안(주차 중)',
    color: '#7B68EE',
    bg: '#F0EEFF',
    render: (c) => <MaterialCommunityIcons name="seat-passenger" size={34} color={c} />,
  },
  {
    key: 'standing',
    desc: '서 있는 자리에서',
    color: '#20B2AA',
    bg: '#E6F7F6',
    render: (c) => <Ionicons name="person-outline" size={34} color={c} />,
  },
  {
    key: 'walking',
    desc: '걸으면서 (안전한 곳에서)',
    color: '#F5A623',
    bg: '#FEF5E7',
    render: (c) => <MaterialCommunityIcons name="walk" size={34} color={c} />,
  },
];

export default function PositionScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { settings } = useStore();

  const choose = (posture: Posture) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/exercise/time', params: { posture } });
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader onBack={goBack} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>지금 어떤 자세예요?</Text>
        <View style={styles.cards}>
          {POSTURES.map((p) => {
            const last = settings.lastPosture === p.key;
            return (
              <Pressable
                key={p.key}
                accessibilityRole="button"
                accessibilityLabel={POSTURE_LABEL[p.key]}
                onPress={() => choose(p.key)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: last ? colors.accent : colors.border,
                    borderWidth: last ? 2 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: p.bg }]}>{p.render(p.color)}</View>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {POSTURE_LABEL[p.key]}
                    </Text>
                    {last ? (
                      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.badgeText}>지난번</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20 },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    gap: 16,
    minHeight: 92,
  },
  iconWrap: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  cardDesc: { fontSize: 15, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
