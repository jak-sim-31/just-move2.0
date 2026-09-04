import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ExerciseRecord } from '@/constants/types';
import {
  filterRecordsByRange,
  getActiveDayCount,
  getDifficultyCounts,
  getLongestStreak,
  getMonthDayCounts,
  getMostCompletedExercise,
  getRewardLevel,
  getStartOfMonth,
  getStartOfWeek,
  getEndOfMonth,
  getEndOfWeek,
  getTotalDuration,
  getTotalPoints,
  getWeekDayCounts,
  getCurrentStreak,
} from '@/constants/stats';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hour}:${min}`;
  } catch {
    return '';
  }
}

type Segment = '최근 기록' | '주간 통계' | '월간 통계';
const SEGMENTS: Segment[] = ['최근 기록', '주간 통계', '월간 통계'];
const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const MONTH_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatBox({
  label, value, colors,
}: {
  label: string; value: string; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[statBoxStyles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[statBoxStyles.val, { color: colors.primary }]}>{value}</Text>
      <Text style={[statBoxStyles.lbl, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const statBoxStyles = StyleSheet.create({
  box: {
    flex: 1, alignItems: 'center', borderRadius: 10,
    borderWidth: 1, paddingVertical: 10, paddingHorizontal: 4,
  },
  val: { fontSize: 20, fontWeight: '800' },
  lbl: { fontSize: 11, marginTop: 2, textAlign: 'center' },
});

function DiffRow({ counts, colors }: { counts: { easy: number; normal: number; hard: number }; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={diffStyles.row}>
      <View style={[diffStyles.tag, { backgroundColor: colors.secondary }]}>
        <Text style={[diffStyles.tagText, { color: colors.textSecondary }]}>가볍게 {counts.easy}</Text>
      </View>
      <View style={[diffStyles.tag, { backgroundColor: '#FFF3E0' }]}>
        <Text style={[diffStyles.tagText, { color: '#B45309' }]}>보통 {counts.normal}</Text>
      </View>
      <View style={[diffStyles.tag, { backgroundColor: '#E8F0F7' }]}>
        <Text style={[diffStyles.tagText, { color: '#173B57' }]}>도전 {counts.hard}</Text>
      </View>
    </View>
  );
}
const diffStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '700' },
});

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({
  counts, labels, colors,
}: {
  counts: number[]; labels: string[]; colors: ReturnType<typeof useColors>;
}) {
  const maxCount = Math.max(...counts, 1);
  const BAR_H = 80;
  return (
    <View style={barStyles.wrap}>
      {counts.map((count, i) => (
        <View key={i} style={barStyles.col}>
          <Text style={[barStyles.countLabel, { color: count > 0 ? colors.primary : colors.textSecondary }]}>
            {count > 0 ? count : ''}
          </Text>
          <View style={[barStyles.barBg, { height: BAR_H, backgroundColor: colors.muted }]}>
            <View
              style={[
                barStyles.bar,
                {
                  height: Math.max(4, (count / maxCount) * BAR_H),
                  backgroundColor: count > 0 ? colors.primary : colors.border,
                },
              ]}
            />
          </View>
          <Text style={[barStyles.dayLabel, { color: colors.textSecondary }]}>
            {labels[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}
const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  countLabel: { fontSize: 11, fontWeight: '700', height: 16 },
  barBg: { width: '100%', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 4 },
  dayLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});

// ─── Weekly stats ─────────────────────────────────────────────────────────────
function WeeklyStats({ records, colors }: { records: ExerciseRecord[]; colors: ReturnType<typeof useColors> }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const now = new Date();
  const targetDate = new Date(now.getTime() + weekOffset * 7 * 86_400_000);
  const weekStart = getStartOfWeek(targetDate);
  const weekEnd = getEndOfWeek(targetDate);

  const weekRecords = useMemo(
    () => filterRecordsByRange(records, weekStart, weekEnd),
    [records, weekStart.toISOString()]
  );

  const dayCounts = useMemo(() => getWeekDayCounts(weekRecords, weekStart), [weekRecords]);
  const activeDays = getActiveDayCount(weekRecords);
  const totalMin = getTotalDuration(weekRecords);
  const totalPts = getTotalPoints(weekRecords);
  const longestStr = getCurrentStreak(records);
  const diffCounts = getDifficultyCounts(weekRecords);

  // Format week label
  const isThisWeek = weekOffset === 0;
  const fmtDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  const weekLabel = isThisWeek
    ? `이번 주 (${fmtDay(weekStart)} ~ ${fmtDay(weekEnd)})`
    : `${fmtDay(weekStart)} - ${fmtDay(weekEnd)}`;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={weekStyles.scroll}>
      {/* Navigation */}
      <View style={weekStyles.navRow}>
        <Pressable
          onPress={() => setWeekOffset((o) => o - 1)}
          style={({ pressed }) => [weekStyles.navBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Text style={[weekStyles.navLabel, { color: colors.text }]} numberOfLines={1}>
          {weekLabel}
        </Text>
        <Pressable
          onPress={() => setWeekOffset((o) => o + 1)}
          disabled={weekOffset >= 0}
          style={({ pressed }) => [
            weekStyles.navBtn,
            { backgroundColor: colors.secondary, opacity: weekOffset >= 0 ? 0.3 : pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {weekRecords.length === 0 ? (
        <View style={weekStyles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.border} />
          <Text style={[weekStyles.emptyTitle, { color: colors.text }]}>
            {isThisWeek ? '이번 주에는 아직 완료한 운동이 없어요.' : '이 주에는 완료한 운동이 없어요.'}
          </Text>
          {isThisWeek && (
            <Text style={[weekStyles.emptySub, { color: colors.textSecondary }]}>
              1분이라도 움직이면 첫 기록이 만들어져요.
            </Text>
          )}
          {isThisWeek && (
            <Pressable
              style={[weekStyles.emptyBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/exercise/position');
              }}
            >
              <Ionicons name="flash" size={16} color="#FFF" />
              <Text style={weekStyles.emptyBtnText}>지금 움직이기</Text>
            </Pressable>
          )}
          {/* Still show bar chart with all zeros */}
          <View style={{ width: '100%', marginTop: 24 }}>
            <BarChart counts={[0, 0, 0, 0, 0, 0, 0]} labels={WEEK_LABELS} colors={colors} />
          </View>
        </View>
      ) : (
        <>
          {/* Stats grid */}
          <View style={weekStyles.statGrid}>
            <StatBox label="완료 횟수" value={String(weekRecords.length)} colors={colors} />
            <StatBox label="활동일" value={`${activeDays}일`} colors={colors} />
            <StatBox label="운동 시간" value={totalMin > 0 ? `${totalMin}분` : '-'} colors={colors} />
          </View>
          <View style={[weekStyles.statGrid, { marginTop: 8 }]}>
            <StatBox label="획득 MOVE" value={String(totalPts)} colors={colors} />
            <StatBox label="최고 연속" value={`${longestStr}일`} colors={colors} />
            <View style={{ flex: 1 }} />
          </View>

          {/* Difficulty */}
          <Text style={[weekStyles.sectionLabel, { color: colors.text }]}>난이도별</Text>
          <DiffRow counts={diffCounts} colors={colors} />

          {/* Bar chart */}
          <Text style={[weekStyles.sectionLabel, { color: colors.text }]}>일별 활동</Text>
          <BarChart counts={dayCounts} labels={WEEK_LABELS} colors={colors} />
        </>
      )}
    </ScrollView>
  );
}

const weekStyles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  statGrid: { flexDirection: 'row', gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 24, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
});

// ─── Monthly stats ────────────────────────────────────────────────────────────
function MonthlyStats({
  records,
  colors,
  getExerciseById,
}: {
  records: ExerciseRecord[];
  colors: ReturnType<typeof useColors>;
  getExerciseById: (id: string) => { title: string } | undefined;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const monthStart = getStartOfMonth(new Date(year, month, 1));
  const monthEnd = getEndOfMonth(new Date(year, month, 1));

  const monthRecords = useMemo(
    () => filterRecordsByRange(records, monthStart, monthEnd),
    [records, year, month]
  );

  const activeDays = getActiveDayCount(monthRecords);
  const totalMin = getTotalDuration(monthRecords);
  const totalPts = getTotalPoints(monthRecords);
  const longestStr = getLongestStreak(monthRecords);
  const diffCounts = getDifficultyCounts(monthRecords);
  const topExId = getMostCompletedExercise(monthRecords);
  const topExTitle = topExId ? getExerciseById(topExId)?.title : null;
  const dayCounts = useMemo(() => getMonthDayCounts(monthRecords, year, month), [monthRecords]);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isFuture = new Date(year, month + 1, 1) > now;

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // Calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const todayDay = isCurrentMonth ? now.getDate() : -1;

  // Monthly message
  let message = '';
  if (activeDays === 0) message = '이번 달의 첫 움직임을 시작해보세요.';
  else if (activeDays <= 4) message = '작은 움직임이 시작됐어요. 다음 한 번을 이어가세요.';
  else if (activeDays <= 9) message = '움직이는 날이 늘고 있어요. 이번 달 10일에 도전해보세요.';
  else if (activeDays <= 19) message = '운동이 생활 속 루틴으로 자리 잡고 있어요.';
  else message = '대단해요! 이번 달 대부분의 날을 움직임으로 채웠어요.';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={monthStyles.scroll}>
      {/* Navigation */}
      <View style={monthStyles.navRow}>
        <Pressable
          onPress={prevMonth}
          style={({ pressed }) => [monthStyles.navBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Text style={[monthStyles.navLabel, { color: colors.text }]}>
          {year}년 {month + 1}월
        </Text>
        <Pressable
          onPress={nextMonth}
          disabled={isFuture}
          style={({ pressed }) => [
            monthStyles.navBtn,
            { backgroundColor: colors.secondary, opacity: isFuture ? 0.3 : pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Stats grid */}
      <View style={monthStyles.statGrid}>
        <StatBox label="완료 횟수" value={String(monthRecords.length)} colors={colors} />
        <StatBox label="활동일" value={`${activeDays}일`} colors={colors} />
        <StatBox label="운동 시간" value={totalMin > 0 ? `${totalMin}분` : '-'} colors={colors} />
      </View>
      <View style={[monthStyles.statGrid, { marginTop: 8 }]}>
        <StatBox label="획득 MOVE" value={String(totalPts)} colors={colors} />
        <StatBox label="최고 연속" value={`${longestStr}일`} colors={colors} />
        <View style={{ flex: 1 }} />
      </View>

      {/* Difficulty & top exercise */}
      <Text style={[monthStyles.sectionLabel, { color: colors.text }]}>난이도별</Text>
      <DiffRow counts={diffCounts} colors={colors} />
      {topExTitle && (
        <View style={[monthStyles.topExBox, { backgroundColor: colors.secondary }]}>
          <Ionicons name="trophy-outline" size={14} color={colors.accent} />
          <Text style={[monthStyles.topExText, { color: colors.text }]}>
            가장 많이 완료한 운동: <Text style={{ fontWeight: '800' }}>{topExTitle}</Text>
          </Text>
        </View>
      )}

      {/* Calendar */}
      <Text style={[monthStyles.sectionLabel, { color: colors.text }]}>월간 활동</Text>
      {/* Day header */}
      <View style={monthStyles.calHeader}>
        {MONTH_LABELS.map((l) => (
          <Text key={l} style={[monthStyles.calDayLabel, { color: colors.textSecondary }]}>{l}</Text>
        ))}
      </View>
      {/* Calendar cells */}
      <View style={monthStyles.calGrid}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - firstDow + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const count = isValid ? (dayCounts[dayNum] ?? 0) : 0;
          const isToday = dayNum === todayDay;
          const hasActivity = count > 0;
          return (
            <View
              key={idx}
              style={[
                monthStyles.calCell,
                hasActivity && { backgroundColor: colors.primary },
                isToday && !hasActivity && { borderWidth: 1.5, borderColor: colors.primary },
              ]}
            >
              {isValid && (
                <>
                  <Text
                    style={[
                      monthStyles.calDayNum,
                      { color: hasActivity ? '#FFFFFF' : isToday ? colors.primary : colors.text },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {count > 1 && (
                    <Text style={[monthStyles.calCount, { color: hasActivity ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                      {count}
                    </Text>
                  )}
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Monthly message */}
      <View style={[monthStyles.msgBox, { backgroundColor: colors.secondary }]}>
        <Text style={[monthStyles.msgText, { color: colors.text }]}>{message}</Text>
      </View>
    </ScrollView>
  );
}

const monthStyles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navLabel: { flex: 1, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statGrid: { flexDirection: 'row', gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  topExBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 10, marginTop: 8 },
  topExText: { fontSize: 13, flex: 1 },
  calHeader: { flexDirection: 'row', marginBottom: 4 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  calDayNum: { fontSize: 12, fontWeight: '600' },
  calCount: { fontSize: 9, fontWeight: '700' },
  msgBox: { borderRadius: 12, padding: 14, marginTop: 16 },
  msgText: { fontSize: 14, lineHeight: 22 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RecordsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { records, deleteRecord, deletePhoto, getExerciseById, getPhotoForRecord } = useApp();
  const [segment, setSegment] = useState<Segment>('최근 기록');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const recent = records.slice(0, 10);

  const handleDelete = (record: ExerciseRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('기록 삭제', '이 운동 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const photo = getPhotoForRecord(record.id);
          if (photo) await deletePhoto(photo.id);
          await deleteRecord(record.id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ExerciseRecord }) => {
    const ex = getExerciseById(item.exerciseId);
    const photo = getPhotoForRecord(item.id);
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: item.isCompleted ? colors.successLight : colors.border },
        ]}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isCompleted ? colors.successLight : colors.secondary },
            ]}
          >
            <Ionicons
              name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={item.isCompleted ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.isCompleted ? colors.success : colors.textSecondary },
              ]}
            >
              {item.isCompleted ? '완료' : '부분'}
            </Text>
            {item.difficultyLabel ? (
              <Text style={[styles.statusText, { color: colors.textSecondary, marginLeft: 4 }]}>
                · {item.difficultyLabel}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
            {ex?.title ?? '운동'}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {formatDate(item.completedAt)}
          </Text>
          <View style={styles.valueRow}>
            <Ionicons name="trophy-outline" size={13} color={colors.accent} />
            <Text style={[styles.valueText, { color: colors.text }]}>
              {item.completedValue}{item.completedUnit}
            </Text>
            {item.earnedPoints !== undefined && (
              <Text style={[styles.posTag, { color: colors.primary, fontWeight: '700' }]}>
                · +{item.earnedPoints} MOVE
              </Text>
            )}
          </View>
          {item.memo ? (
            <Text style={[styles.memo, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.memo}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          {photo ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${photo.imageBase64}` }}
              style={[styles.thumb, { borderColor: colors.border }]}
            />
          ) : (
            <View style={[styles.thumbEmpty, { backgroundColor: colors.muted }]}>
              <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
            </View>
          )}
          <Pressable
            onPress={() => handleDelete(item)}
            style={[styles.deleteBtn, { backgroundColor: colors.destructiveLight }]}
          >
            <Ionicons name="trash-outline" size={14} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>운동 기록</Text>
        {/* Segment control */}
        <View style={[styles.segmentRow, { backgroundColor: colors.secondary }]}>
          {SEGMENTS.map((seg) => {
            const active = segment === seg;
            return (
              <Pressable
                key={seg}
                onPress={() => setSegment(seg)}
                style={[
                  styles.segBtn,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.segBtnText,
                    { color: active ? '#FFFFFF' : colors.textSecondary },
                    active && { fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  {seg}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {segment === '최근 기록' ? (
        <FlatList
          data={recent}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === 'web' ? 34 + 80 : 80 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="list-circle-outline" size={56} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                아직 운동 기록이 없어요
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                오늘 3분부터 시작해볼까요?
              </Text>
            </View>
          }
        />
      ) : segment === '주간 통계' ? (
        <View style={styles.statsWrap}>
          <WeeklyStats records={records} colors={colors} />
        </View>
      ) : (
        <View style={styles.statsWrap}>
          <MonthlyStats records={records} colors={colors} getExerciseById={getExerciseById} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },

  // Segment control
  segmentRow: {
    flexDirection: 'row', borderRadius: 12, padding: 3, gap: 2,
  },
  segBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  segBtnText: { fontSize: 13, fontWeight: '600' },

  // Stats panels
  statsWrap: { flex: 1, paddingHorizontal: 20 },

  // Recent records list
  list: { paddingHorizontal: 20 },
  card: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1.5,
    padding: 14, marginBottom: 12, gap: 12,
  },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'center', gap: 8 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  exerciseName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 6 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: 13, fontWeight: '700' },
  posTag: { fontSize: 12 },
  memo: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  thumb: { width: 64, height: 64, borderRadius: 10, borderWidth: 1 },
  thumbEmpty: {
    width: 64, height: 64, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 14 },
});
