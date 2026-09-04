import type { Exercise } from './types';

// ============================================================
// 운동 영상 URL — 모든 운동이 동일한 영상을 사용합니다.
// 운동별로 다른 URL을 사용하려면 makeVideoUrl 함수를 수정하세요.
// ============================================================
const VIDEO_URL = 'https://m.blog.naver.com/jak_sim_31/clip/15417337';

function makeYoutubeUrl(_videoId?: string) {
  return {
    youtubeUrl: VIDEO_URL,
    youtubeEmbedUrl: VIDEO_URL,
  };
}

export const SAMPLE_EXERCISES: Exercise[] = [
  {
    id: 'exercise_001',
    title: '벽 푸시업',
    summary: '벽을 이용한 가벼운 상체 운동',
    detailContent:
      '1. 벽에서 팔 길이만큼 떨어져 서세요.\n2. 양손을 어깨 너비로 벽에 짚으세요.\n3. 팔꿈치를 굽혀 코가 벽에 가까워지도록 기울이세요.\n4. 천천히 원위치로 밀어 올리세요.\n5. 허리를 곧게 유지하며 반복하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.wallPushUp),
    positions: ['서있다'],
    durationMinutes: 3,
    targetValue: 15,
    targetUnit: '회',
    bodyPart: '가슴·팔',
    difficulty: '쉬움',
    equipment: '없음 (벽)',
    caution: '손목이 불편하면 주먹을 쥐고 하세요. 어깨보다 너무 넓게 짚지 마세요.',
    isActive: true,
  },
  {
    id: 'exercise_002',
    title: '누워서 무릎 당기기',
    summary: '누운 자세로 허리와 복부를 함께 단련',
    detailContent:
      '1. 등을 바닥에 대고 편안히 누우세요.\n2. 두 무릎을 가슴 쪽으로 천천히 당겨오세요.\n3. 두 팔로 무릎을 감싸 3초 유지하세요.\n4. 천천히 발을 내리되 바닥에 닿기 직전에 멈추세요.\n5. 반복하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.lyingKnee),
    positions: ['누워있다'],
    durationMinutes: 3,
    targetValue: 15,
    targetUnit: '회',
    bodyPart: '허리·복부',
    difficulty: '쉬움',
    equipment: '없음 (매트 권장)',
    caution: '허리 통증이 있다면 강도를 낮추세요. 목에 힘이 들어가지 않게 하세요.',
    isActive: true,
  },
  {
    id: 'exercise_003',
    title: '앉아서 목·어깨 스트레칭',
    summary: '의자에 앉아 목과 어깨 긴장을 풀어요',
    detailContent:
      '1. 등받이에 등을 대고 편안하게 앉으세요.\n2. 오른손을 왼쪽 머리 위에 가볍게 얹으세요.\n3. 천천히 오른쪽으로 목을 기울여 20초 유지하세요.\n4. 반대 방향도 동일하게 실시하세요.\n5. 마지막으로 목을 앞으로 천천히 숙여 30초 유지하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.neckStretch),
    positions: ['앉아있다'],
    durationMinutes: 1,
    targetValue: 30,
    targetUnit: '초 (좌우)',
    bodyPart: '목·어깨',
    difficulty: '쉬움',
    equipment: '없음',
    caution: '무리하게 당기지 마세요. 통증이 있으면 즉시 멈추세요.',
    isActive: true,
  },
  {
    id: 'exercise_004',
    title: '제자리 무릎 높이 걷기',
    summary: '서서 무릎을 높이 들어 심폐를 자극해요',
    detailContent:
      '1. 양발을 어깨 너비로 벌려 서세요.\n2. 오른쪽 무릎을 배꼽 높이까지 들어올리세요.\n3. 팔을 반대 방향으로 함께 흔들어 주세요.\n4. 왼쪽으로 교차하며 리듬감 있게 반복하세요.\n5. 호흡을 유지하며 꾸준히 하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.marchingKnee),
    positions: ['서있다', '걷고 있다'],
    durationMinutes: 3,
    targetValue: 50,
    targetUnit: '회 (좌우)',
    bodyPart: '하체·심폐',
    difficulty: '보통',
    equipment: '없음',
    caution: '무릎 관절이 좋지 않다면 높이를 낮춰서 하세요.',
    isActive: true,
  },
  {
    id: 'exercise_005',
    title: '앉아서 발목 돌리기',
    summary: '앉은 상태에서 하체 혈액순환 개선',
    detailContent:
      '1. 의자에 앉아 한쪽 발을 들어올리세요.\n2. 발목을 시계 방향으로 10회 천천히 돌리세요.\n3. 반시계 방향으로도 10회 돌리세요.\n4. 반대 발도 동일하게 실시하세요.\n5. 두 발을 동시에 까치발로 올렸다 내리세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.ankleFoot),
    positions: ['앉아있다'],
    durationMinutes: 1,
    targetValue: 10,
    targetUnit: '회 (각 방향)',
    bodyPart: '발목·종아리',
    difficulty: '쉬움',
    equipment: '없음',
    caution: '발목 부상이 있다면 하지 마세요.',
    isActive: true,
  },
  {
    id: 'exercise_006',
    title: '누워서 다리 들기',
    summary: '누운 자세로 하복부와 허벅지 강화',
    detailContent:
      '1. 등을 대고 누워 두 손을 엉덩이 아래 받치세요.\n2. 두 다리를 모아 바닥에서 30도 정도 들어올리세요.\n3. 3초 유지 후 천천히 내리되 바닥에 닿기 전에 멈추세요.\n4. 허리가 뜨지 않도록 복부에 힘을 주세요.\n5. 반복하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.legRaise),
    positions: ['누워있다'],
    durationMinutes: 5,
    targetValue: 12,
    targetUnit: '회',
    bodyPart: '복부·허벅지',
    difficulty: '보통',
    equipment: '없음 (매트 권장)',
    caution: '허리 통증이 있으면 무릎을 약간 구부려서 하세요.',
    isActive: true,
  },
  {
    id: 'exercise_007',
    title: '의자 스쿼트',
    summary: '의자를 활용한 부담 없는 하체 강화',
    detailContent:
      '1. 의자 앞에 어깨 너비로 서세요.\n2. 의자에 살짝 앉듯이 천천히 내려가세요.\n3. 엉덩이가 의자에 닿으면 바로 일어서세요.\n4. 무릎이 발끝 앞으로 나오지 않게 주의하세요.\n5. 팔은 앞으로 뻗어 균형을 잡으세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.chairSquat),
    positions: ['서있다'],
    durationMinutes: 5,
    targetValue: 15,
    targetUnit: '회',
    bodyPart: '허벅지·엉덩이',
    difficulty: '보통',
    equipment: '의자',
    caution: '무릎 통증이 있다면 깊이 내려가지 마세요. 등을 곧게 유지하세요.',
    isActive: true,
  },
  {
    id: 'exercise_008',
    title: '어깨 돌리기 & 가슴 펴기',
    summary: '굳은 어깨와 가슴을 시원하게 풀어요',
    detailContent:
      '1. 양발을 바닥에 붙이고 편안하게 앉으세요.\n2. 어깨를 앞에서 뒤로 크게 5회 돌리세요.\n3. 뒤에서 앞으로도 5회 돌리세요.\n4. 두 손을 등 뒤에서 깍지 끼고 가슴을 앞으로 열어주세요.\n5. 10초 유지 후 천천히 풀어주세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.shoulderRoll),
    positions: ['앉아있다', '서있다'],
    durationMinutes: 1,
    targetValue: 10,
    targetUnit: '회',
    bodyPart: '어깨·가슴',
    difficulty: '쉬움',
    equipment: '없음',
    caution: '어깨 통증이 있다면 범위를 줄여서 하세요.',
    isActive: true,
  },
  {
    id: 'exercise_009',
    title: '걸으면서 팔 스윙',
    summary: '걷는 중 팔을 힘차게 흔들어 상체 활성화',
    detailContent:
      '1. 평소보다 빠른 걸음으로 걷기 시작하세요.\n2. 팔꿈치를 90도로 굽혀 앞뒤로 힘차게 흔드세요.\n3. 좌우 팔을 교차하며 몸통도 함께 돌려주세요.\n4. 허리를 곧게 펴고 시선은 정면을 향하세요.\n5. 자연스럽게 호흡하며 유지하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.armSwing),
    positions: ['걷고 있다'],
    durationMinutes: 5,
    targetValue: 100,
    targetUnit: '걸음',
    bodyPart: '전신·심폐',
    difficulty: '쉬움',
    equipment: '없음',
    caution: '주변 공간을 확인하고 진행하세요.',
    isActive: true,
  },
  {
    id: 'exercise_010',
    title: '누워서 허리 비틀기',
    summary: '누운 자세로 허리 긴장 해소 및 유연성 향상',
    detailContent:
      '1. 등을 대고 편안히 누우세요.\n2. 두 무릎을 세우고 발바닥을 바닥에 붙이세요.\n3. 두 무릎을 오른쪽으로 천천히 기울이세요.\n4. 양 어깨는 바닥에서 떨어지지 않게 하세요.\n5. 20초 유지 후 반대쪽도 동일하게 하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.spinalTwist),
    positions: ['누워있다'],
    durationMinutes: 1,
    targetValue: 20,
    targetUnit: '초 (좌우)',
    bodyPart: '허리·척추',
    difficulty: '쉬움',
    equipment: '없음 (매트 권장)',
    caution: '너무 빠르게 돌리지 마세요. 통증이 있으면 즉시 멈추세요.',
    isActive: true,
  },
  {
    id: 'exercise_011',
    title: '까치발 들기',
    summary: '서거나 걸으면서 종아리 근육 단련',
    detailContent:
      '1. 양발을 어깨 너비로 벌려 서세요. (의자나 벽을 잡아도 됩니다)\n2. 발 앞꿈치로 천천히 올라가세요.\n3. 1~2초 유지하세요.\n4. 천천히 발꿈치를 내리되 완전히 닿기 전에 멈추세요.\n5. 반복하세요.',
    ...makeYoutubeUrl(SAMPLE_VIDEO_IDS.calfRaise),
    positions: ['서있다', '걷고 있다'],
    durationMinutes: 3,
    targetValue: 20,
    targetUnit: '회',
    bodyPart: '종아리',
    difficulty: '쉬움',
    equipment: '없음',
    caution: '균형을 잃으면 벽이나 의자를 잡으세요.',
    isActive: true,
  },
];

export const getRecommendedExercises = (
  position: string,
  minutes: number
): Exercise[] => {
  const filtered = SAMPLE_EXERCISES.filter(
    (ex) =>
      ex.isActive &&
      ex.positions.includes(position as any) &&
      ex.durationMinutes <= minutes
  ).sort((a, b) => a.durationMinutes - b.durationMinutes);

  if (filtered.length > 0) {
    return filtered.slice(0, 3);
  }

  // 조건에 맞는 운동이 없으면 같은 상태에서 가장 짧은 운동 3개
  const fallback = SAMPLE_EXERCISES.filter(
    (ex) => ex.isActive && ex.positions.includes(position as any)
  ).sort((a, b) => a.durationMinutes - b.durationMinutes);

  if (fallback.length > 0) {
    return fallback.slice(0, 3);
  }

  // 그래도 없으면 전체에서 가장 짧은 운동 3개
  return SAMPLE_EXERCISES.filter((ex) => ex.isActive)
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .slice(0, 3);
};

export function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function extractVideoId(embedUrl: string): string {
  const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}
