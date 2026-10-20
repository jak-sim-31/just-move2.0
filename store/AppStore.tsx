import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EXERCISES, TIP_CARDS, WELCOME_MESSAGES, exerciseById } from '@/data/content';
import { localRepository, type Repository, type UserData } from '@/data/repository';
import { appConfig } from '@/lib/config';
import { dateKey, todayKey } from '@/lib/date';
import { addDrops, waterCrop as waterCropRule, type WaterResult } from '@/lib/farm';
import { pickMessage, relationOf, restBucketOf, welcomeRestDays, type WelcomeMessage } from '@/lib/messages';
import { buildPlaylist, pickReplacement, type RecommendOptions } from '@/lib/recommend';
import { creditedMinutes, dropsToGrant, isItemCompleted } from '@/lib/session';
import { dropsOnDate, movedDateKeys } from '@/lib/stats';
import type {
  AppSettings,
  Exercise,
  InProgress,
  Perceived,
  Posture,
  Session,
  SessionItem,
} from '@/lib/types';

type Planned = 1 | 3 | 5;

interface StoreValue extends UserData {
  ready: boolean;
  startSession(posture: Posture, plannedMin: Planned): InProgress;
  /** 현재 재생 상태를 저장 (재생 초는 slotPlayedSec에 누적된 값) */
  saveProgress(next: InProgress): void;
  /** '다음 동작': 현재 슬롯을 다른 동작으로 교체 */
  replaceCurrentSlot(current: InProgress): InProgress;
  finishSession(current: InProgress): Session;
  setPerceived(sessionId: string, perceived: Perceived | undefined): void;
  waterCrop(): WaterResult;
  /** 오늘 보여 줄 환영 문구. 조건이 아니면 null */
  getWelcome(): WelcomeMessage | null;
  markWelcomeShown(messageId: string): void;
  markLoginPromptShown(): void;
  mockLogin(provider: 'kakao' | 'google' | 'guest'): void;
  setNotification(n: AppSettings['notification']): void;
  setReminder(patch: Partial<AppSettings['reminder']>): void;
  /** 알림 문구 기록 (최근 문구 중복 방지) */
  recordNotificationShown(messageId: string): void;
  resetAll(): Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const empty: UserData = {
  sessions: [],
  progress: {},
  farm: { drops: 0, cropProgress: 0, harvestCount: 0, unlockedTipIds: [] },
  settings: {
    firstUseDate: todayKey(),
    lastPosture: null,
    welcomeShownDate: null,
    loginPromptShown: false,
    notification: { ...appConfig.notificationDefault },
    reminder: { snoozeUntil: null, stopDate: null, lastFiredKey: null },
    account: { provider: 'guest' },
  },
  history: { welcome: [], notification: [] },
  inProgress: null,
};

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AppStoreProvider({
  children,
  repository = localRepository,
}: {
  children: React.ReactNode;
  repository?: Repository;
}) {
  const [data, setData] = useState<UserData>(empty);
  const [ready, setReady] = useState(false);
  const ref = useRef<UserData>(empty);

  const commit = useCallback((patch: Partial<UserData>) => {
    ref.current = { ...ref.current, ...patch };
    setData(ref.current);
  }, []);

  /** 중단된 세션을 기록으로 확정한다 (이어하지 않은 채 날이 바뀌었거나 새 운동을 시작할 때) */
  const finalize = useCallback(
    (cur: InProgress): Session => {
      const items: SessionItem[] = [
        ...cur.extraItems,
        ...cur.playlist.map((id, i) => ({
          exerciseId: id,
          playedSec: Math.round(cur.slotPlayedSec[i] ?? 0),
          skipped: false,
        })),
      ].filter((it) => it.skipped || it.playedSec > 0);

      const actualSec = Math.round(items.reduce((s, it) => s + it.playedSec, 0));
      const credited = creditedMinutes(actualSec);
      const already = dropsOnDate(ref.current.sessions, cur.localDate);
      const drops = dropsToGrant(credited, already, appConfig.dropDailyLimit);

      const session: Session = {
        id: cur.id,
        startedAt: cur.startedAt,
        localDate: cur.localDate,
        posture: cur.posture,
        plannedMin: cur.plannedMin,
        actualSec,
        creditedMin: credited,
        dropsEarned: drops,
        items,
      };

      const sessions = [session, ...ref.current.sessions.filter((s) => s.id !== session.id)];
      commit({ sessions, inProgress: null });
      void repository.saveSessions(sessions);
      void repository.saveInProgress(null);

      if (credited >= 1) {
        const progress = { ...ref.current.progress };
        for (const it of items) {
          if (isItemCompleted(it.playedSec, it.skipped, appConfig.videoSec, appConfig.completeRatio)) {
            progress[it.exerciseId] = (progress[it.exerciseId] ?? 0) + 1;
          }
        }
        commit({ progress });
        void repository.saveProgress(progress);
      }
      if (drops > 0) {
        const farm = addDrops(ref.current.farm, drops);
        commit({ farm });
        void repository.saveFarm(farm);
      }
      return session;
    },
    [commit, repository],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await repository.load();
      if (!alive) return;
      ref.current = loaded;
      setData(loaded);
      // 어제 이전에 멈춘 세션은 이어하지 않은 것으로 보고 확정
      if (loaded.inProgress && loaded.inProgress.localDate !== todayKey()) {
        finalize(loaded.inProgress);
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [repository, finalize]);

  const recommendBase = useCallback(
    (posture: Posture, slots: Planned): RecommendOptions => {
      const today = todayKey();
      const skippedToday = ref.current.sessions
        .filter((s) => s.localDate === today)
        .flatMap((s) => s.items.filter((it) => it.skipped).map((it) => it.exerciseId));
      return {
        posture,
        slots,
        exercises: EXERCISES,
        progress: ref.current.progress,
        skippedToday,
        masteredThreshold: appConfig.masteredThreshold,
        newRatio: appConfig.newRatio,
        masteredChance: appConfig.masteredChance,
      };
    },
    [],
  );

  const startSession = useCallback(
    (posture: Posture, plannedMin: Planned): InProgress => {
      if (ref.current.inProgress) finalize(ref.current.inProgress);
      const list = buildPlaylist(recommendBase(posture, plannedMin));
      const now = Date.now();
      const cur: InProgress = {
        id: newId(),
        startedAt: new Date(now).toISOString(),
        localDate: dateKey(now),
        posture,
        plannedMin,
        playlist: list.map((e) => e.id),
        slotIndex: 0,
        slotPlayedSec: list.map(() => 0),
        extraItems: [],
        updatedAt: new Date(now).toISOString(),
      };
      const settings = { ...ref.current.settings, lastPosture: posture };
      commit({ inProgress: cur, settings });
      void repository.saveInProgress(cur);
      void repository.saveSettings(settings);
      return cur;
    },
    [commit, finalize, recommendBase, repository],
  );

  const saveProgress = useCallback(
    (next: InProgress) => {
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      commit({ inProgress: stamped });
      void repository.saveInProgress(stamped);
    },
    [commit, repository],
  );

  const replaceCurrentSlot = useCallback(
    (cur: InProgress): InProgress => {
      const i = cur.slotIndex;
      const opts = recommendBase(cur.posture, cur.plannedMin);
      const neighbors = [
        exerciseById(cur.playlist[i - 1] ?? '')?.bodyPart,
        exerciseById(cur.playlist[i + 1] ?? '')?.bodyPart,
      ];
      const rep = pickReplacement(opts, cur.playlist, i, neighbors);
      const playlist = [...cur.playlist];
      const slotPlayedSec = [...cur.slotPlayedSec];
      const skippedItem: SessionItem = {
        exerciseId: cur.playlist[i],
        playedSec: Math.round(slotPlayedSec[i] ?? 0),
        skipped: true,
      };
      if (rep) playlist[i] = rep.id;
      slotPlayedSec[i] = 0;
      const next = { ...cur, playlist, slotPlayedSec, extraItems: [...cur.extraItems, skippedItem] };
      saveProgress(next);
      return next;
    },
    [recommendBase, saveProgress],
  );

  const finishSession = useCallback(
    (cur: InProgress): Session => finalize(cur),
    [finalize],
  );

  const setPerceived = useCallback(
    (sessionId: string, perceived: Perceived | undefined) => {
      const sessions = ref.current.sessions.map((s) =>
        s.id === sessionId ? { ...s, perceived } : s,
      );
      commit({ sessions });
      void repository.saveSessions(sessions);
    },
    [commit, repository],
  );

  const waterCrop = useCallback((): WaterResult => {
    const result = waterCropRule(
      ref.current.farm,
      appConfig.dropsPerHarvest,
      TIP_CARDS.map((t) => t.id),
    );
    if (result.watered) {
      commit({ farm: result.farm });
      void repository.saveFarm(result.farm);
    }
    return result;
  }, [commit, repository]);

  const getWelcome = useCallback((): WelcomeMessage | null => {
    const { sessions, settings, history } = ref.current;
    const today = todayKey();
    const moved = movedDateKeys(sessions);
    const rest = welcomeRestDays(moved, today, settings.welcomeShownDate);
    if (rest === null) return null;
    const relation = relationOf(settings.firstUseDate, today, moved.length);
    const group = WELCOME_MESSAGES.filter(
      (m) => m.restBucket === restBucketOf(rest) && m.relation === relation,
    );
    return pickMessage(group, history.welcome);
  }, []);

  const markWelcomeShown = useCallback(
    (messageId: string) => {
      const settings = { ...ref.current.settings, welcomeShownDate: todayKey() };
      const history = {
        ...ref.current.history,
        welcome: [...ref.current.history.welcome, messageId].slice(-10),
      };
      commit({ settings, history });
      void repository.saveSettings(settings);
      void repository.saveHistory(history);
    },
    [commit, repository],
  );

  const patchSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      const settings = { ...ref.current.settings, ...patch };
      commit({ settings });
      void repository.saveSettings(settings);
    },
    [commit, repository],
  );

  const markLoginPromptShown = useCallback(
    () => patchSettings({ loginPromptShown: true }),
    [patchSettings],
  );
  const mockLogin = useCallback(
    (provider: 'kakao' | 'google' | 'guest') => patchSettings({ account: { provider } }),
    [patchSettings],
  );
  const setNotification = useCallback(
    (notification: AppSettings['notification']) => patchSettings({ notification }),
    [patchSettings],
  );

  const setReminder = useCallback(
    (patch: Partial<AppSettings['reminder']>) =>
      patchSettings({ reminder: { ...ref.current.settings.reminder, ...patch } }),
    [patchSettings],
  );
  const recordNotificationShown = useCallback(
    (messageId: string) => {
      const history = {
        ...ref.current.history,
        notification: [...ref.current.history.notification, messageId].slice(-10),
      };
      commit({ history });
      void repository.saveHistory(history);
    },
    [commit, repository],
  );

  const resetAll = useCallback(async () => {
    await repository.clear();
    const fresh = await repository.load();
    ref.current = fresh;
    setData(fresh);
  }, [repository]);

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      ready,
      startSession,
      saveProgress,
      replaceCurrentSlot,
      finishSession,
      setPerceived,
      waterCrop,
      getWelcome,
      markWelcomeShown,
      markLoginPromptShown,
      mockLogin,
      setNotification,
      setReminder,
      recordNotificationShown,
      resetAll,
    }),
    [
      data, ready, startSession, saveProgress, replaceCurrentSlot, finishSession, setPerceived,
      waterCrop, getWelcome, markWelcomeShown, markLoginPromptShown, mockLogin, setNotification,
      setReminder, recordNotificationShown, resetAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

export type { Exercise };
