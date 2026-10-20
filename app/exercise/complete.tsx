import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Button, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';
import { PERCEIVED_LABEL, type Perceived } from '@/lib/types';

const PERCEIVED_ORDER: Perceived[] = ['light', 'fit', 'hard'];

export default function CompleteScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { ready, sessions, settings, setPerceived, markLoginPromptShown, mockLogin } = useStore();
  const session = sessions.find((s) => s.id === id);

  const [sheet, setSheet] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;

  const credited = session?.creditedMin ?? 0;
  const shouldAskLogin =
    credited >= 1 && !settings.loginPromptShown && settings.account.provider === 'guest';

  useEffect(() => {
    if (!session) return;
    if (credited >= 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    }
  }, [session, credited, pop]);

  useEffect(() => {
    if (!shouldAskLogin) return;
    const t = setTimeout(() => setSheet(true), 900);
    return () => clearTimeout(t);
  }, [shouldAskLogin]);

  const closeSheet = () => {
    setSheet(false);
    markLoginPromptShown();
  };

  const goHome = () => router.replace('/(tabs)');

  if (!ready || !session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: pad.top + 40 }]}>
        <Text style={[styles.sub, { color: colors.textSecondary, textAlign: 'center' }]}>
          {ready ? '운동 기록을 찾지 못했어요.' : ''}
        </Text>
        {ready ? <Button label="홈으로" onPress={goHome} style={{ margin: 24 }} /> : null}
      </View>
    );
  }

  // 1분 미만: 기록·보상 없이 격려만
  if (credited === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.center, { paddingTop: pad.top + 40 }]}>
          <View style={[styles.circle, { backgroundColor: colors.secondary }]}>
            <Ionicons name="heart-outline" size={52} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            움직이려고 한 것만으로도 충분해요
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            1분 이상 움직이면 물방울을 받아요. 언제든 다시 해봐요.
          </Text>
        </View>
        <View style={[styles.bottom, { paddingBottom: pad.bottom + 16 }]}>
          <Button label="다시 해보기" onPress={() => router.replace('/exercise/position')} />
          <Button label="홈으로" variant="outline" onPress={goHome} />
        </View>
      </View>
    );
  }

  const full = session.dropsEarned < credited;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.center, { paddingTop: pad.top + 32, paddingBottom: 24 }]}>
        <Animated.View style={{ transform: [{ scale }], opacity: pop }}>
          <View style={[styles.circle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark" size={56} color={colors.success} />
          </View>
        </Animated.View>
        <Text style={[styles.title, { color: colors.text }]}>오늘도 움직였어요!</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {session.creditedMin}분 동안 함께했어요
        </Text>

        <View style={[styles.dropCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="water" size={30} color="#3B9AE1" />
          <View style={{ flex: 1 }}>
            {session.dropsEarned > 0 ? (
              <Text style={[styles.dropText, { color: colors.text }]}>
                물방울 +{session.dropsEarned}
              </Text>
            ) : null}
            {full ? (
              <Text style={[styles.dropSub, { color: colors.textSecondary }]}>
                오늘 물방울은 다 모았어요
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={[styles.question, { color: colors.text }]}>오늘 운동은 어땠나요?</Text>
        <Text style={[styles.optional, { color: colors.textSecondary }]}>선택하지 않아도 괜찮아요</Text>
        <View style={styles.perceivedRow}>
          {PERCEIVED_ORDER.map((p) => {
            const on = session.perceived === p;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityLabel={PERCEIVED_LABEL[p]}
                accessibilityState={{ selected: on }}
                onPress={() => setPerceived(session.id, on ? undefined : p)}
                style={[
                  styles.perceived,
                  {
                    backgroundColor: on ? colors.primary : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.perceivedText, { color: on ? '#fff' : colors.text }]}>
                  {PERCEIVED_LABEL[p]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: pad.bottom + 16 }]}>
        <Button label="농장 가기" variant="accent" onPress={() => router.replace('/(tabs)/farm')} />
        <Button label="홈으로" variant="outline" onPress={goHome} />
      </View>

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={styles.modalBack}>
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: pad.bottom + 20 }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              기록과 작물을 잃지 않도록 저장해 둘까요?
            </Text>
            <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
              로그인하면 지금까지의 운동 기록이 그대로 이어져요.
            </Text>
            <Button
              label="카카오로 계속"
              style={{ backgroundColor: '#FEE500' }}
              variant="ghost"
              onPress={() => {
                mockLogin('kakao');
                closeSheet();
              }}
            />
            <Button
              label="구글로 계속"
              variant="outline"
              onPress={() => {
                mockLogin('google');
                closeSheet();
              }}
            />
            <Button label="나중에 하기" variant="ghost" onPress={closeSheet} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  circle: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  sub: { fontSize: 16, textAlign: 'center' },
  dropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    alignSelf: 'stretch',
    marginTop: 12,
  },
  dropText: { fontSize: 20, fontWeight: '800' },
  dropSub: { fontSize: 15, marginTop: 2 },
  question: { fontSize: 18, fontWeight: '700', marginTop: 20 },
  optional: { fontSize: 14 },
  perceivedRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  perceived: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perceivedText: { fontSize: 15, fontWeight: '700' },
  bottom: { paddingHorizontal: 20, gap: 10, paddingTop: 8 },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetSub: { fontSize: 15, marginBottom: 4 },
});
