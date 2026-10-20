import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { BottomBar, FlowHeader, useLegacyPad } from '@/components/Legacy';
import { useStore } from '@/store/AppStore';

/**
 * 인증사진 — 수정 전 인증사진 화면(357e0d7)을 그대로 옮기고 운동 1회(세션)에 연결했다.
 * 사진은 이 기기에만 저장한다. 저장하거나 건너뛰면 완료 화면의 보상 단계로 간다.
 */
export default function PhotoScreen() {
  const colors = useColors();
  const pad = useLegacyPad();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addPhoto } = useStore();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const toReward = () =>
    id ? router.replace({ pathname: '/exercise/complete', params: { id, phase: 'reward' } }) : router.replace('/(tabs)');

  const accept = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
    setPhotoUri(uri);
    setNotice(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pickFromCamera = async () => {
    if (Platform.OS === 'web') {
      setNotice('웹에서는 카메라를 사용할 수 없어요. 사진 불러오기를 이용해 주세요.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setNotice('설정에서 카메라 접근을 허용해 주세요.');
      return;
    }
    accept(
      await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5, base64: true, allowsEditing: true, aspect: [1, 1] }),
    );
  };

  const pickFromGallery = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice('설정에서 사진 접근을 허용해 주세요.');
        return;
      }
    }
    accept(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true, allowsEditing: true, aspect: [1, 1] }),
    );
  };

  const handleSave = () => {
    if (!photoUri || !id) {
      setNotice('먼저 사진을 선택해 주세요.');
      return;
    }
    setSaving(true);
    addPhoto({ sessionId: id, imageUri: photoUri, capturedAt: new Date().toISOString(), memo: memo.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toReward();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlowHeader
        onBack={toReward}
        title="인증사진 남기기"
        right={
          <Pressable onPress={toReward} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>건너뛰기</Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: pad.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {photoUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUri }} style={[styles.preview, { borderColor: colors.border }]} resizeMode="cover" />
              <Pressable
                accessibilityRole="button"
                style={[styles.changePhoto, { backgroundColor: colors.primary }]}
                onPress={() => setPhotoUri(null)}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>다시 선택</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickRow}>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.primary, transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
                onPress={pickFromCamera}
              >
                <Ionicons name="camera" size={36} color={colors.primary} />
                <Text style={[styles.pickLabel, { color: colors.primary }]}>카메라 촬영</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.pickBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
                onPress={pickFromGallery}
              >
                <Ionicons name="images" size={36} color={colors.textSecondary} />
                <Text style={[styles.pickLabel, { color: colors.textSecondary }]}>사진 불러오기</Text>
              </Pressable>
            </View>
          )}

          {notice ? (
            <View style={[styles.privacyNote, { backgroundColor: colors.secondary }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>{notice}</Text>
            </View>
          ) : null}

          <View style={[styles.privacyNote, { backgroundColor: colors.successLight }]}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.success} />
            <Text style={[styles.privacyText, { color: colors.success }]}>
              사진은 이 기기에만 저장되고 외부로 전송되지 않아요
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>자세 메모 (선택)</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="예: 팔꿈치를 더 가깝게, 자세가 좋아졌어요..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.memoInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            multiline
            numberOfLines={2}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar>
        <Pressable accessibilityRole="button" style={[styles.skipBtnFull, { borderColor: colors.border }]} onPress={toReward}>
          <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>건너뛰기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: photoUri ? colors.primary : colors.muted, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          onPress={handleSave}
          disabled={!photoUri || saving}
        >
          <Ionicons name="save-outline" size={18} color={photoUri ? '#FFFFFF' : colors.textSecondary} />
          <Text style={[styles.saveBtnText, { color: photoUri ? '#FFFFFF' : colors.textSecondary }]}>
            {saving ? '저장 중...' : '사진과 함께 저장'}
          </Text>
        </Pressable>
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipText: { fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  previewWrap: { alignItems: 'center', marginBottom: 20 },
  preview: { width: 240, height: 240, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  changePhoto: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  changePhotoText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  pickRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  pickBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1.5, paddingVertical: 28, gap: 10 },
  pickLabel: { fontSize: 14, fontWeight: '700' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10, marginBottom: 20 },
  privacyText: { fontSize: 12, flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  memoInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 72, textAlignVertical: 'top' },
  skipBtnFull: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  skipBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 14 },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
