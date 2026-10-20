import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button, ScreenHeader, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';

/**
 * 로그인 화면.
 * 로컬 단계: 버튼만 동작하는 모의 로그인(계정 연결 표시만 바뀜).
 * 베타 단계: 카카오·구글 로그인을 연결하고, 기기의 기록을 계정으로 이어 붙인다.
 */
export default function LoginScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { mockLogin } = useStore();

  const done = (p: 'kakao' | 'google') => {
    mockLogin(p);
    router.canGoBack() ? router.back() : router.replace('/(tabs)/my');
  };
  const later = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader onBack={later} />
      <View style={[styles.body, { paddingBottom: pad.bottom + 24 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>기록과 작물을{'\n'}잃지 않게 저장해 둘까요?</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          로그인하면 지금까지의 운동 기록이 그대로 이어져요.
        </Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          <Button label="카카오로 계속" variant="ghost" style={{ backgroundColor: '#FEE500' }} onPress={() => done('kakao')} />
          <Button label="구글로 계속" variant="outline" onPress={() => done('google')} />
          <Button label="나중에 하기" variant="ghost" onPress={later} />
        </View>
        {__DEV__ ? (
          <Text style={[styles.dev, { color: colors.mutedForeground }]}>
            개발용: 실제 로그인은 연결되어 있지 않아요 (모의 로그인)
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 36 },
  sub: { fontSize: 16, lineHeight: 24 },
  dev: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
