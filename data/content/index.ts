import exercisesJson from './exercises.json';
import messagesJson from './messages.json';
import tipsJson from './tips.json';
import type { Exercise } from '@/lib/types';
import type { WelcomeMessage } from '@/lib/messages';

/**
 * 운영자 관리 콘텐츠.
 * 로컬 단계: 이 폴더의 JSON 파일을 수정한다.
 * 베타 단계: 구글 스프레드시트 자동 반영으로 교체한다. (화면은 이 모듈만 읽는다)
 */
export const EXERCISES = exercisesJson as Exercise[];
export const WELCOME_MESSAGES = messagesJson.welcome as WelcomeMessage[];

export interface NotificationMessage {
  id: string;
  segment: 'not_moved' | 'moved';
  text: string;
}
export const NOTIFICATION_MESSAGES = messagesJson.notification as NotificationMessage[];

export interface DailyPhrase {
  id: string;
  band: 'morning' | 'afternoon' | 'evening';
  text: string;
}
export const DAILY_PHRASES = messagesJson.phrases as DailyPhrase[];

export interface TipCard {
  id: string;
  type: 'recipe' | 'health';
  title: string;
  body: string;
}
export const TIP_CARDS = tipsJson as TipCard[];

export const exerciseById = (id: string): Exercise | undefined =>
  EXERCISES.find((e) => e.id === id);
