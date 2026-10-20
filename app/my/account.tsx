import React, { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Button, ScreenHeader, useScreenPad } from '@/components/ui';
import { useStore } from '@/store/AppStore';

const PROVIDER_LABEL = { guest: '로그인하지 않았어요', kakao: '카카오', google: '구글' } as const;

export default function AccountScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { settings, mockLogin, resetAll } = useStore();
  const [confirm, setConfirm] = useState(false);
  const provider = settings.account.provider;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my'));

  const withdraw = async () => {
    // 로컬 단계: 기기에 저장된 모든 데이터를 지운다.
    // 베타 단계: 계정 정보는 즉시 삭제하고, 운동 기록은 누구의 것인지 알 수 없게 바꿔 통계에만 사용한다.
    await resetAll();
    setConfirm(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="계정·탈퇴" onBack={goBack} />
      <View style={[styles.body, { paddingBottom: pad.bottom + 24 }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>로그인 정보</Text>
          <Text style={[styles.value, { color: colors.text }]}>{PROVIDER_LABEL[provider]}</Text>
        </View>

        {provider === 'guest' ? (
          <Button label="로그인하고 기록 저장하기" onPress={() => router.push('/login')} />
        ) : (
          <Button label="로그아웃" variant="outline" onPress={() => mockLogin('guest')} />
        )}

        <View style={{ flex: 1 }} />
        <Button label="회원 탈퇴" variant="ghost" onPress={() => setConfirm(true)} />
      </View>

      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.back}>
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>정말 탈퇴할까요?</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              계정 정보가 삭제되고, 운동 기록과 농장은 이 기기에서 모두 사라져요.
              {'\n'}운동 기록은 누구의 것인지 알 수 없게 바뀐 통계로만 남아요.
            </Text>
            <Button label="탈퇴하기" onPress={withdraw} style={{ backgroundColor: colors.destructive }} />
            <Button label="취소" variant="outline" onPress={() => setConfirm(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, padding: 20, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  sub: { fontSize: 14, lineHeight: 21 },
  value: { fontSize: 18, fontWeight: '800' },
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 24, padding: 24, gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: '800' },
});
