import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
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

// WebView imported conditionally to handle web
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch {}
}

export default function VideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedExercise } = useApp();
  const [webViewError, setWebViewError] = useState(false);
  const [loading, setLoading] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!selectedExercise) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            운동을 선택해주세요
          </Text>
        </View>
      </View>
    );
  }

  const ex = selectedExercise;

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/exercise/complete');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.primary, borderBottomColor: 'rgba(255,255,255,0.1)' },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtnWrap}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{ex.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video area */}
      <View style={[styles.videoWrap, { backgroundColor: '#000' }]}>
        {Platform.OS !== 'web' && WebView && !webViewError ? (
          <>
            {loading && (
              <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <WebView
              source={{ uri: ex.youtubeEmbedUrl }}
              style={styles.webview}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setWebViewError(true); setLoading(false); }}
              allowsInlineMediaPlayback
              javaScriptEnabled
              domStorageEnabled
            />
          </>
        ) : (
          <Pressable
            style={styles.webFallback}
            onPress={() => Linking.openURL(ex.youtubeUrl)}
          >
            <Ionicons name="play-circle-outline" size={48} color="#FFFFFF" />
            <Text style={styles.webFallbackText}>
              {webViewError ? '영상을 불러올 수 없어요' : '영상을 보려면 탭하세요'}
            </Text>
            <Text style={styles.webFallbackSub}>브라우저에서 열기</Text>
          </Pressable>
        )}
      </View>

      {/* Exercise info */}
      <View style={styles.infoArea}>
        <View style={[styles.goalRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>목표</Text>
            <Text style={[styles.goalValue, { color: colors.text }]}>
              {ex.targetValue} {ex.targetUnit}
            </Text>
          </View>
          <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>시간</Text>
            <Text style={[styles.goalValue, { color: colors.text }]}>{ex.durationMinutes}분</Text>
          </View>
          <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>부위</Text>
            <Text style={[styles.goalValue, { color: colors.text }]} numberOfLines={1}>
              {ex.bodyPart}
            </Text>
          </View>
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.muted }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            끝까지 하지 않아도 괜찮아요. 움직인 만큼 기록할 수 있어요.
          </Text>
        </View>
      </View>

      {/* Complete button */}
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
            styles.doneBtn,
            {
              backgroundColor: colors.success,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: colors.success,
            },
          ]}
          onPress={handleComplete}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.doneBtnText}>움직임 완료</Text>
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
  backBtnWrap: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  videoWrap: { height: 220, width: '100%' },
  webview: { flex: 1, backgroundColor: '#000' },
  loadingOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', zIndex: 1 },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  webFallbackText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  webFallbackSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  infoArea: { flex: 1, padding: 20, gap: 12 },
  goalRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  goalItem: { flex: 1, alignItems: 'center' },
  goalLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  goalValue: { fontSize: 16, fontWeight: '700' },
  goalDivider: { width: 1, height: 32 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    padding: 12,
  },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 17,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  doneBtnText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 40, left: 20 },
  emptyText: { fontSize: 16 },
});
