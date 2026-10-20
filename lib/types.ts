export type Posture = 'lying' | 'sitting' | 'standing' | 'walking';
export type Perceived = 'light' | 'fit' | 'hard';

export const POSTURE_LABEL: Record<Posture, string> = {
  lying: '누워서',
  sitting: '앉아서',
  standing: '서서',
  walking: '걸으며',
};

export const PERCEIVED_LABEL: Record<Perceived, string> = {
  light: '가벼웠어요',
  fit: '적당했어요',
  hard: '힘들었어요',
};

/** 운동 목록 (운영자 관리 데이터) */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  postures: Posture[];
  bodyPart: string;
  carOk: boolean;
  /** public/videos 아래 파일 경로 (예: /videos/lying-01.mp4). 파일이 없으면 임시 재생 모드 */
  video: string;
  orientation: 'portrait' | 'landscape';
  isFirst: boolean;
  active: boolean;
}

export interface SessionItem {
  exerciseId: string;
  playedSec: number;
  skipped: boolean;
}

/** 저장된 운동 1회 */
export interface Session {
  id: string;
  startedAt: string; // ISO
  localDate: string; // KST YYYY-MM-DD
  posture: Posture;
  plannedMin: 1 | 3 | 5;
  actualSec: number;
  creditedMin: 0 | 1 | 3 | 5;
  dropsEarned: number;
  perceived?: Perceived;
  items: SessionItem[];
}

/** 영상 재생 중인 세션 (중간 저장용) */
export interface InProgress {
  id: string;
  startedAt: string;
  localDate: string;
  posture: Posture;
  plannedMin: 1 | 3 | 5;
  /** 슬롯별 현재 동작 id */
  playlist: string[];
  slotIndex: number;
  /** 슬롯별 재생 초 / 건너뜀 */
  slotPlayedSec: number[];
  /** 건너뛰기로 교체되어 밀려난 동작의 재생 기록 */
  extraItems: SessionItem[];
  updatedAt: string;
}

export interface AppSettings {
  firstUseDate: string;
  lastPosture: Posture | null;
  welcomeShownDate: string | null;
  loginPromptShown: boolean;
  notification: { enabled: boolean; startHour: number; endHour: number };
  /** 알림 미루기 상태 (앱이 열려 있을 때의 알림용) */
  reminder: { snoozeUntil: number | null; stopDate: string | null; lastFiredKey: string | null };
  /** 모의 로그인 상태 (베타에서 실제 로그인으로 교체) */
  account: { provider: 'guest' | 'kakao' | 'google' };
}

export interface MessageHistory {
  welcome: string[];
  notification: string[];
}
