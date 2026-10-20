import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useScreenPad } from '@/components/ui';
import VideoSurface from '@/components/VideoSurface';
import { exerciseById } from '@/data/content';
import { appConfig } from '@/lib/config';
import { useStore } from '@/store/AppStore';
import type { InProgress } from '@/lib/types';

const SAVE_EVERY_MS = 5000;
const TICK_MS = 250;

function fmt(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function totalPlayed(cur: InProgress): number {
  return (
    cur.slotPlayedSec.reduce((a, b) => a + b, 0) +
    cur.extraItems.reduce((a, b) => a + b.playedSec, 0)
  );
}

export default function PlayScreen() {
  const colors = useColors();
  const pad = useScreenPad();
  const { ready, inProgress, saveProgress, replaceCurrentSlot, finishSession } = useStore();

  const curRef = useRef<InProgress | null>(inProgress);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [position, setPosition] = useState(0); // 현재 영상 재생 위치(초)
  const [paused, setPaused] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const finishedRef = useRef(false);
  const lastTick = useRef(Date.now());
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);

  // 새로고침 등으로 늦게 불러온 경우
  useEffect(() => {
    if (ready && !curRef.current) {
      curRef.current = inProgress;
      rerender();
    }
  }, [ready, inProgress]);

  useEffect(() => {
    if (ready && !inProgress && !curRef.current && !finishedRef.current) {
      router.replace('/(tabs)');
    }
  }, [ready, inProgress]);

  const cur = curRef.current;
  const exercise = cur ? exerciseById(cur.playlist[cur.slotIndex]) : undefined;
  const active = !paused && (failed || videoActive);
  const activeRef = useRef(active);
  activeRef.current = active;
  useWakeLock(!!cur && !paused);

  const persist = useCallback(() => {
    const c = curRef.current;
    if (!c || finishedRef.current) return;
    saveProgress({ ...c, slotPlayedSec: [...c.slotPlayedSec] });
  }, [saveProgress]);

  const finish = useCallback(() => {
    const c = curRef.current;
    if (!c || finishedRef.current) return;
    finishedRef.current = true;
    const session = finishSession({ ...c, slotPlayedSec: [...c.slotPlayedSec] });
    router.replace({ pathname: '/exercise/complete', params: { id: session.id } });
  }, [finishSession]);

  const goToSlot = useCallback(
    (index: number) => {
      const c = curRef.current;
      if (!c) return;
      curRef.current = { ...c, slotIndex: index };
      setPosition(0);
      setFailed(false);
      setVideoActive(false);
      persist();
      rerender();
    },
    [persist],
  );

  const advance = useCallback(() => {
    const c = curRef.current;
    if (!c || finishedRef.current) return;
    if (c.slotIndex >= c.playlist.length - 1) finish();
    else goToSlot(c.slotIndex + 1);
  }, [finish, goToSlot]);

  // 재생 시간 측정: 영상이 실제로 재생 중일 때만 쌓는다
  useEffect(() => {
    lastTick.current = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTick.current) / 1000;
      lastTick.current = now;
      const c = curRef.current;
      if (!c || !activeRef.current || finishedRef.current) return;
      c.slotPlayedSec[c.slotIndex] = (c.slotPlayedSec[c.slotIndex] ?? 0) + dt;
      setPosition((p) => p + dt);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // 임시 재생 모드는 영상 길이만큼 흐르면 다음으로
  useEffect(() => {
    if (failed && position >= appConfig.videoSec) advance();
  }, [failed, position, advance]);

  // 중간 저장 + 화면을 떠날 때 저장
  useEffect(() => {
    const timer = setInterval(persist, SAVE_EVERY_MS);
    return () => {
      clearInterval(timer);
      persist();
    };
  }, [persist]);

  // 탭이 숨겨지면 일시정지
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        setPaused(true);
        persist();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [persist]);

  const onPrev = () => {
    if (!cur || cur.slotIndex === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goToSlot(cur.slotIndex - 1);
  };

  const onNext = () => {
    if (!cur) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    curRef.current = replaceCurrentSlot({ ...cur, slotPlayedSec: [...cur.slotPlayedSec] });
    setPosition(0);
    setFailed(false);
    setVideoActive(false);
    rerender();
  };

  const failedRef = useRef(false);
  failedRef.current = failed;
  const onBlocked = useCallback(() => {
    if (!failedRef.current) setPaused(true);
  }, []);
  const onFail = useCallback(() => {
    failedRef.current = true;
    setFailed(true);
    setPaused(false);
  }, []);

  if (!cur || !exercise) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const remaining = cur.plannedMin * 60 - totalPlayed(cur);
  const portrait = exercise.orientation === 'portrait';
  const ratio = portrait ? 9 / 16 : 16 / 9;
  const boxSize = (() => {
    if (!area) return { width: 0, height: 0 };
    const maxW = Math.max(0, area.w - 24);
    const maxH = Math.max(0, area.h);
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { width: Math.floor(w), height: Math.floor(h) };
  })();
  const showCarNotice = exercise.carOk && cur.posture === 'sitting';

  return (
    <View style={[styles.container, { backgroundColor: '#0E1A24' }]}>
      <View style={[styles.top, { paddingTop: pad.top + 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.sub}>
            {cur.slotIndex + 1} / {cur.playlist.length}
          </Text>
        </View>
        <View style={styles.remainWrap}>
          <Ionicons name="time-outline" size={16} color="#C9D6E0" />
          <Text style={styles.remain}>남은 {fmt(remaining)}</Text>
        </View>
      </View>

      <View
        style={styles.videoArea}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? '재생' : '일시정지'}
          onPress={() => {
            setPaused((p) => !p);
            persist();
          }}
          style={[styles.videoBox, boxSize]}
        >
          {!failed ? (
            <VideoSurface
              src={exercise.video}
              playing={!paused}
              onActiveChange={setVideoActive}
              onEnded={advance}
              onFail={onFail}
              onBlocked={onBlocked}
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="videocam-outline" size={40} color="#8FA3B3" />
              <Text style={styles.phTitle}>{exercise.name}</Text>
              <Text style={styles.phDesc}>{exercise.description}</Text>
              <Text style={styles.phNote}>영상 파일을 준비 중이에요 (임시 재생)</Text>
            </View>
          )}
          {paused ? (
            <View style={styles.pauseOverlay}>
              <Ionicons name="play-circle" size={72} color="#FFFFFF" />
              <Text style={styles.pauseText}>탭해서 이어서 하기</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, (position / appConfig.videoSec) * 100)}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>

      <View style={styles.notices}>
        {showCarNotice ? (
          <View style={styles.carBadge}>
            <Ionicons name="car-outline" size={16} color="#FFD27A" />
            <Text style={styles.carText}>주차 중일 때만 해주세요</Text>
          </View>
        ) : null}
        <Text style={styles.safety}>통증이나 어지러움이 느껴지면 즉시 멈춰주세요</Text>
      </View>

      {__DEV__ && failed ? (
        <Pressable
          onPress={() => {
            const c = curRef.current;
            if (!c) return;
            c.slotPlayedSec[c.slotIndex] = (c.slotPlayedSec[c.slotIndex] ?? 0) + 10;
            setPosition((p) => p + 10);
          }}
          style={styles.devBtn}
        >
          <Text style={styles.devText}>+10초 (개발용)</Text>
        </Pressable>
      ) : null}

      <View style={[styles.controls, { paddingBottom: pad.bottom + 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 동작"
          onPress={onPrev}
          disabled={cur.slotIndex === 0}
          style={[styles.ctrl, { opacity: cur.slotIndex === 0 ? 0.35 : 1 }]}
        >
          <Ionicons name="play-skip-back" size={22} color="#fff" />
          <Text style={styles.ctrlText}>이전 동작</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="그만하기"
          onPress={finish}
          style={[styles.ctrl, styles.stop]}
        >
          <Ionicons name="stop" size={22} color="#fff" />
          <Text style={styles.ctrlText}>그만하기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 동작"
          onPress={onNext}
          style={styles.ctrl}
        >
          <Ionicons name="play-skip-forward" size={22} color="#fff" />
          <Text style={styles.ctrlText}>다음 동작</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  sub: { color: '#9DB0C0', fontSize: 14, marginTop: 2 },
  remainWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remain: { color: '#C9D6E0', fontSize: 15, fontWeight: '600' },
  videoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  videoBox: { backgroundColor: '#000', borderRadius: 16, overflow: 'hidden' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#17283A',
  },
  phTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  phDesc: { color: '#C9D6E0', fontSize: 16, textAlign: 'center' },
  phNote: { color: '#8FA3B3', fontSize: 13, marginTop: 8 },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pauseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: '#24384A', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  notices: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  carBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,166,35,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  carText: { color: '#FFD27A', fontSize: 14, fontWeight: '700' },
  safety: { color: '#9DB0C0', fontSize: 14, textAlign: 'center' },
  devBtn: { alignSelf: 'center', marginTop: 6, padding: 6 },
  devText: { color: '#6C8296', fontSize: 12 },
  controls: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  ctrl: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#24384A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stop: { backgroundColor: '#355873' },
  ctrlText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
