import React, { useState } from 'react';
import {
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export default function PhotoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentRecordId, addPhoto, generateId, resetSession } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const pickFromCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('알림', '웹에서는 카메라를 사용할 수 없어요. 사진 불러오기를 이용해 주세요.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('카메라 권한 필요', '설정에서 카메라 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhotoBase64(result.assets[0].base64);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('사진 권한 필요', '설정에서 사진 접근을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0].base64) {
      setPhotoBase64(result.assets[0].base64);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!photoBase64 || !currentRecordId) {
      Alert.alert('사진 없음', '먼저 사진을 선택해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const photo = {
        id: generateId(),
        recordId: currentRecordId,
        imageBase64: photoBase64,
        capturedAt: new Date().toISOString(),
        memo: memo || undefined,
        isPrivate: true,
      };
      await addPhoto(photo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('저장 실패', '사진을 저장하는 중 오류가 발생했어요.');
    } finally {
      setSaving(false);
      resetSession();
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    resetSession();
    router.replace('/(tabs)');
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
        <Pressable onPress={handleSkip} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>인증사진 남기기</Text>
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>건너뛰기</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: botPad + 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo preview / picker */}
          {photoBase64 ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
                style={[styles.preview, { borderColor: colors.border }]}
                resizeMode="cover"
              />
              <Pressable
                style={[styles.changePhoto, { backgroundColor: colors.primary }]}
                onPress={() => setPhotoBase64(null)}
              >
                <Ionicons name="refresh" size={14} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>다시 선택</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.pickBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                onPress={pickFromCamera}
              >
                <Ionicons name="camera" size={36} color={colors.primary} />
                <Text style={[styles.pickLabel, { color: colors.primary }]}>카메라 촬영</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.pickBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                onPress={pickFromGallery}
              >
                <Ionicons name="images" size={36} color={colors.textSecondary} />
                <Text style={[styles.pickLabel, { color: colors.textSecondary }]}>
                  사진 불러오기
                </Text>
              </Pressable>
            </View>
          )}

          {/* Privacy notice */}
          <View style={[styles.privacyNote, { backgroundColor: colors.successLight }]}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.success} />
            <Text style={[styles.privacyText, { color: colors.success }]}>
              사진은 이 기기에만 저장되고 외부로 전송되지 않아요
            </Text>
          </View>

          {/* Memo */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>자세 메모 (선택)</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="예: 팔꿈치를 더 가깝게, 자세가 좋아졌어요..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.memoInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            multiline
            numberOfLines={2}
          />
        </ScrollView>
      </KeyboardAvoidingView>

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
          style={[styles.skipBtnFull, { borderColor: colors.border }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>건너뛰기</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: photoBase64 ? colors.primary : colors.muted,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
          onPress={handleSave}
          disabled={!photoBase64 || saving}
        >
          <Ionicons
            name="save-outline"
            size={18}
            color={photoBase64 ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.saveBtnText,
              { color: photoBase64 ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {saving ? '저장 중...' : '사진과 함께 저장'}
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
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  skipBtn: { width: 60, alignItems: 'flex-end' },
  skipText: { fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  previewWrap: { alignItems: 'center', marginBottom: 20 },
  preview: { width: 240, height: 240, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  changePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  changePhotoText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  pickRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  pickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 28,
    gap: 10,
  },
  pickLabel: { fontSize: 14, fontWeight: '700' },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  privacyText: { fontSize: 12, flex: 1 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  memoInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  bottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skipBtnFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  skipBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
