import React from 'react';
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

export default function ExerciseTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetSession, setPosition } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : 0;

  const handleSelect = (pos: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetSession();
    setPosition(pos);
    router.push('/exercise/time');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>지금 어떤 자세예요?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          현재 상태에 맞는 운동을 바로 추천해 드려요
        </Text>

        <View style={styles.cards}>
          {POSITIONS.map((p) => (
            <Pressable
              key={p.key}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={() => handleSelect(p.key)}
            >
              <View style={[styles.iconWrap, { backgroundColor: p.bg }]}>
                {p.lib === 'Ionicons' ? (
                  <Ionicons name={p.icon as any} size={32} color={p.color} />
                ) : (
                  <MaterialCommunityIcons name={p.icon as any} size={32} color={p.color} />
                )}
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{p.key}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.notice, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
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
  cards: { gap: 12, marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
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
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { fontSize: 13, flex: 1 },
});
