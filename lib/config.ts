import config from '@/data/content/config.json';

/** 운영자가 바꿀 수 있는 설정값 (베타 단계에서는 스프레드시트 '설정' 시트로 대체) */
export type AppConfig = typeof config;
export const appConfig: AppConfig = config;
