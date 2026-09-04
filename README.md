# JUST MOVE 2.0

사용자의 현재 자세, 가능한 시간, 운동하고 싶은 부위에 맞춰 짧은 움직임을 제안하고 운동 기록과 보상으로 다음 행동을 유도하는 운동 습관 형성 MVP입니다.

## 주요 대상

- 운동을 시작했다가 중단한 30~50대 여성
- 운동할 시간이 부족하거나 무엇부터 해야 할지 모르는 사람
- 1~5분의 짧은 움직임부터 시작하고 싶은 사람

## 현재 구현 기능

- 현재 자세 선택: 눕기, 앉기, 서기, 걷기
- 가능한 운동 시간 선택: 1분, 3분, 5분
- 운동 추천 및 상세 안내
- 운동 영상 연결
- 운동 완료 및 인증사진 기록
- 최근 활동과 운동 일정 관리

## 개발 예정 기능

- 운동 희망 부위 복수 선택
- 생활 상황별 Micro-action 추천
- 시간대에 맞는 환영 메시지
- 뒤로 가기 기능 개선
- 물방울, 농장 성장 및 작물 바구니
- 주간·월간 통계와 연속 운동일
- 알림 및 AI 운동 대화

## 기술 구성

- React Native
- Expo / Expo Router
- TypeScript
- React Native Web
- AsyncStorage

## 프로젝트 구조

```text
app/          화면과 페이지
assets/       앱 아이콘과 이미지
components/   공통 화면 구성요소
constants/    운동 데이터와 설정
context/      앱 상태와 운동 기록 관리
hooks/        공통 기능
scripts/      빌드 관련 기능
server/       웹 실행 서버
```

## 현재 개발 상태

JUST MOVE 2.0 초기 MVP 원본입니다.

현재 일부 기능은 추가 점검과 수정이 필요합니다.

- `SAMPLE_VIDEO_IDS is not defined` 오류 수정
- 실제 JUST MOVE 운동 영상 연결
- Replit 전용 패키지 설정 정리
- 독립 실행환경 및 모바일 화면 점검

## 주의사항

JUST MOVE의 운동 추천은 일반적인 생활체육 콘텐츠이며 의료 진단이나 치료를 대신하지 않습니다. 통증이나 질환이 있는 사용자는 운동 전 전문가와 상담해야 합니다.

## 기획

- Project: JUST MOVE
- Founder & Planner: 심재경
- Version: 2.0 MVP
- Status: Development
