import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FarmState } from '@/lib/farm';
import { initialFarm } from '@/lib/farm';
import { appConfig } from '@/lib/config';
import { todayKey } from '@/lib/date';
import type {
  AppSettings,
  InProgress,
  MessageHistory,
  ProofPhoto,
  Schedule,
  Session,
} from '@/lib/types';

/**
 * 데이터 접근 계층.
 * 화면과 앱 상태는 이 인터페이스만 사용한다.
 * 로컬 단계: LocalRepository (기기 저장소)
 * 베타 단계: 같은 인터페이스를 서버(Supabase 등)로 구현해 교체한다.
 */
export interface UserData {
  sessions: Session[];
  /** 동작별 완료 횟수 */
  progress: Record<string, number>;
  farm: FarmState;
  settings: AppSettings;
  history: MessageHistory;
  inProgress: InProgress | null;
  /** 운동 예약 (수정 전 기능) */
  schedules: Schedule[];
  /** 인증사진 (수정 전 기능) */
  photos: ProofPhoto[];
}

export interface Repository {
  load(): Promise<UserData>;
  saveSessions(sessions: Session[]): Promise<void>;
  saveProgress(progress: Record<string, number>): Promise<void>;
  saveFarm(farm: FarmState): Promise<void>;
  saveSettings(settings: AppSettings): Promise<void>;
  saveHistory(history: MessageHistory): Promise<void>;
  saveInProgress(inProgress: InProgress | null): Promise<void>;
  saveSchedules(schedules: Schedule[]): Promise<void>;
  savePhotos(photos: ProofPhoto[]): Promise<void>;
  /** 모든 기기 데이터 삭제 (개발·탈퇴용) */
  clear(): Promise<void>;
}

const KEY = {
  sessions: 'jm2.sessions',
  progress: 'jm2.progress',
  farm: 'jm2.farm',
  settings: 'jm2.settings',
  history: 'jm2.history',
  inProgress: 'jm2.inProgress',
  schedules: 'jm2.schedules',
  photos: 'jm2.photos',
} as const;

export function defaultSettings(now: number = Date.now()): AppSettings {
  return {
    firstUseDate: todayKey(now),
    lastPosture: null,
    welcomeShownDate: null,
    loginPromptShown: false,
    notification: { ...appConfig.notificationDefault },
    reminder: { snoozeUntil: null, stopDate: null, lastFiredKey: null },
    account: { provider: 'guest' },
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간 부족 등: 화면 흐름은 막지 않는다
  }
}

export const localRepository: Repository = {
  async load() {
    const [sessions, progress, farm, settings, history, inProgress, schedules, photos] = await Promise.all([
      readJson<Session[]>(KEY.sessions, []),
      readJson<Record<string, number>>(KEY.progress, {}),
      readJson<FarmState>(KEY.farm, initialFarm),
      readJson<AppSettings | null>(KEY.settings, null),
      readJson<MessageHistory>(KEY.history, { welcome: [], notification: [] }),
      readJson<InProgress | null>(KEY.inProgress, null),
      readJson<Schedule[]>(KEY.schedules, []),
      readJson<ProofPhoto[]>(KEY.photos, []),
    ]);
    const merged = { ...defaultSettings(), ...(settings ?? {}) };
    if (!settings) await writeJson(KEY.settings, merged);
    return { sessions, progress, farm, settings: merged, history, inProgress, schedules, photos };
  },
  saveSessions: (v) => writeJson(KEY.sessions, v),
  saveProgress: (v) => writeJson(KEY.progress, v),
  saveFarm: (v) => writeJson(KEY.farm, v),
  saveSettings: (v) => writeJson(KEY.settings, v),
  saveHistory: (v) => writeJson(KEY.history, v),
  saveSchedules: (v) => writeJson(KEY.schedules, v),
  savePhotos: (v) => writeJson(KEY.photos, v),
  async saveInProgress(v) {
    if (v === null) {
      try {
        await AsyncStorage.removeItem(KEY.inProgress);
      } catch {
        // 무시
      }
    } else {
      await writeJson(KEY.inProgress, v);
    }
  },
  async clear() {
    try {
      await AsyncStorage.multiRemove(Object.values(KEY));
    } catch {
      // 무시
    }
  },
};
