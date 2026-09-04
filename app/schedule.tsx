import React, { useState } from 'react';
import {
  Alert,
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
import * as Haptics from 'expo-haptics';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = getTodayStr();
  const tomorrow = getTomorrowStr();
  if (dateStr === today) return '오늘';
  if (dateStr === tomorrow) return '내일';
  return dateStr;
}

const DATE_PRESETS = ['오늘', '내일', '직접 입력'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_LIST = ['00', '10', '20', '30', '40', '50'];

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedExercise, addSchedule, generateId } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const ex = selectedExercise;

  const [datePreset, setDatePreset] = useState<string>('오늘');
  const [customDate, setCustomDate] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [targetValue, setTargetValue] = useState<string>(ex ? String(ex.targetValue) : '10');
  const [repeat, setRepeat] = useState<'once' | 'daily'>('once');

  const getScheduledDate = () => {
    if (datePreset === '오늘') return getTodayStr();
    if (datePreset === '내일') return getTomorrowStr();
    return customDate || getTodayStr();
  };

  const handleSave = async () => {
    if (!ex) {
      Alert.alert('오류', '운동을 선택해주세요.');
      return;
    }
    const date = getScheduledDate();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('날짜 형식 오류', 'YYYY-MM-DD 형식으로 입력해주세요.\n예: 2026-07-30');
      return;
    }

    const schedule = {
      id: generateId(),
      exerciseId: ex.id,
      scheduledDate: date,
      scheduledTime: `${hour}:${minute}`,
      targetValue: Number(targetValue) || ex.targetValue,
      targetUnit: ex.targetUnit,
      repeatType: repeat,
      notificationEnabled: true,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
    };

    await addSchedule(schedule);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      '예약 완료',
      `${date === getTodayStr() ? '오늘' : date} ${hour}:${minute}에 ${ex.title} ${schedule.targetValue}${ex.targetUnit}을 예약했어요.\n\n앱이 열려있을 때만 알림이 표시돼요.`,
      [{ text: '확인', onPress: () => router.replace('/(tabs)') }]
    );
  };

  if (!ex) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Text style={[{ color: colors.textSecondary, fontSize: 16 }]}>
            운동을 선택해주세요
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>돌아가기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>운동 예약</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise card */}
          <View style={[styles.exCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.exCardLabel}>예약할 운동</Text>
            <Text style={styles.exCardTitle}>{ex.title}</Text>
            <Text style={styles.exCardSub}>기본 목표 {ex.targetValue}{ex.targetUnit}</Text>
          </View>

          {/* Date selection */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>날짜</Text>
          <View style={styles.presetRow}>
            {DATE_PRESETS.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: datePreset === p ? colors.primary : colors.card,
                    borderColor: datePreset === p ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setDatePreset(p)}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: datePreset === p ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
          {datePreset === '직접 입력' && (
            <TextInput
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="YYYY-MM-DD (예: 2026-07-30)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
              ]}
            />
          )}

          {/* Time */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>시간</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeScrollWrap}>
              <Text style={[styles.timeScrollLabel, { color: colors.textSecondary }]}>시</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeScroll}
                contentContainerStyle={styles.timeScrollContent}
              >
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: hour === h ? colors.accent : colors.card,
                        borderColor: hour === h ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setHour(h)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        { color: hour === h ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {h}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.timeSep, { color: colors.text }]}>:</Text>
            <View style={styles.timeScrollWrap}>
              <Text style={[styles.timeScrollLabel, { color: colors.textSecondary }]}>분</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeScroll}
                contentContainerStyle={styles.timeScrollContent}
              >
                {MINUTES_LIST.map((m) => (
                  <Pressable
                    key={m}
                    style={[
                      styles.timeChip,
                      {
                        backgroundColor: minute === m ? colors.accent : colors.card,
                        borderColor: minute === m ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => setMinute(m)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        { color: minute === m ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <Text style={[styles.timePreview, { color: colors.textSecondary }]}>
            예약 시각: {formatDateLabel(getScheduledDate())} {hour}:{minute}
          </Text>

          {/* Target */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>목표량</Text>
          <View style={[styles.targetRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setTargetValue((v) => String(Math.max(1, Number(v) - 1)))}
              style={[styles.stepper, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </Pressable>
            <TextInput
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
              style={[styles.targetInput, { color: colors.text }]}
              selectTextOnFocus
            />
            <Text style={[styles.unitText, { color: colors.textSecondary }]}>{ex.targetUnit}</Text>
            <Pressable
              onPress={() => setTargetValue((v) => String(Number(v) + 1))}
              style={[styles.stepper, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {/* Repeat */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>반복</Text>
          <View style={styles.repeatRow}>
            {(['once', 'daily'] as const).map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.repeatBtn,
                  {
                    backgroundColor: repeat === r ? colors.primary : colors.card,
                    borderColor: repeat === r ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setRepeat(r)}
              >
                <Ionicons
                  name={r === 'once' ? 'today-outline' : 'repeat'}
                  size={16}
                  color={repeat === r ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.repeatText,
                    { color: repeat === r ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {r === 'once' ? '한번만' : '매일 반복'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notice */}
          <View style={[styles.notice, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              알림은 앱이 열려있을 때만 화면 내부에서 표시돼요. 정확한 푸시 알림은 다음 버전에서 지원해요.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save button */}
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
            styles.saveBtn,
            {
              backgroundColor: colors.accent,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: colors.accent,
            },
          ]}
          onPress={handleSave}
        >
          <Ionicons name="calendar" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>예약 저장</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  exCard: { borderRadius: 14, padding: 18, marginBottom: 24, gap: 4 },
  exCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  exCardTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  exCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  presetText: { fontSize: 14, fontWeight: '600' },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 8 },
  timeScrollWrap: { flex: 1 },
  timeScrollLabel: { fontSize: 12, marginBottom: 6 },
  timeScroll: { maxHeight: 44 },
  timeScrollContent: { gap: 6, paddingHorizontal: 2 },
  timeChip: {
    borderRadius: 8,
    borderWidth: 1,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipText: { fontSize: 13, fontWeight: '700' },
  timeSep: { fontSize: 20, fontWeight: '700', paddingBottom: 10, paddingHorizontal: 4 },
  timePreview: { fontSize: 13, marginBottom: 20, textAlign: 'center' },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  stepper: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  targetInput: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', height: 48 },
  unitText: { fontSize: 13, paddingRight: 12 },
  repeatRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  repeatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  repeatText: { fontSize: 14, fontWeight: '600' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: { fontSize: 12, flex: 1, lineHeight: 18 },
  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
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
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
