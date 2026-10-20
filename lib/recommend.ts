import type { Exercise, Posture } from '@/lib/types';

export interface RecommendOptions {
  posture: Posture;
  slots: 1 | 3 | 5;
  exercises: Exercise[];
  /** 동작별 완료 횟수 */
  progress: Record<string, number>;
  /** 오늘 건너뛴 동작 (후보에서 빼지 않고 우선순위만 낮춘다) */
  skippedToday?: string[];
  masteredThreshold: number;
  newRatio: number;
  masteredChance: number;
  rng?: () => number;
}

type Kind = 'learning' | 'new' | 'mastered';

function kindOf(count: number, threshold: number): Kind {
  if (count <= 0) return 'new';
  return count >= threshold ? 'mastered' : 'learning';
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 후보를 (오늘 건너뛰지 않은 것 먼저) 섞어서 반환 */
function ordered(list: Exercise[], skipped: string[], rng: () => number): Exercise[] {
  const fresh = shuffle(list.filter((e) => !skipped.includes(e.id)), rng);
  const skip = shuffle(list.filter((e) => skipped.includes(e.id)), rng);
  return [...fresh, ...skip];
}

/**
 * 추천 규칙
 * 1) 선택한 자세의 동작만 후보
 * 2) 1~(기준-1)회 완료한 '익히는 중' 동작 우선
 * 3) 3·5분은 익히는 중 + 새 동작 혼합 (새 동작 비율 = newRatio)
 * 4) 직전 동작과 같은 부위가 연속되지 않게
 * 5) 기준 횟수 이상은 '익힌 동작', 슬롯마다 낮은 확률로만 노출
 * 6) 오늘 건너뛴 동작도 다시 추천될 수 있음
 * 첫 사용자(완료 0회)의 첫 동작은 '첫 동작' 지정 동작
 */
export function buildPlaylist(opts: RecommendOptions): Exercise[] {
  const rng = opts.rng ?? Math.random;
  const skipped = opts.skippedToday ?? [];
  const pool = opts.exercises.filter((e) => e.active && e.postures.includes(opts.posture));
  if (pool.length === 0) return [];

  const kinds: Record<Kind, Exercise[]> = { learning: [], new: [], mastered: [] };
  for (const e of pool) {
    kinds[kindOf(opts.progress[e.id] ?? 0, opts.masteredThreshold)].push(e);
  }
  const queue: Record<Kind, Exercise[]> = {
    learning: ordered(kinds.learning, skipped, rng),
    new: ordered(kinds.new, skipped, rng),
    mastered: ordered(kinds.mastered, skipped, rng),
  };

  const totalDone = Object.values(opts.progress).reduce((a, b) => a + b, 0);
  const result: Exercise[] = [];

  const take = (kind: Kind, prevPart: string | undefined): Exercise | null => {
    const q = queue[kind];
    const idx = q.findIndex((e) => e.bodyPart !== prevPart);
    const pick = idx >= 0 ? idx : q.length > 0 ? 0 : -1;
    if (pick < 0) return null;
    return q.splice(pick, 1)[0];
  };

  // 슬롯별 희망 종류 결정
  const wantNew =
    opts.slots === 1
      ? 0
      : Math.min(opts.slots, Math.max(1, Math.round(opts.slots * opts.newRatio)));
  const desired: Kind[] = [];
  let newLeft = Math.min(wantNew, kinds.new.length);
  for (let i = 0; i < opts.slots; i++) {
    if (opts.slots > 1 && newLeft > 0 && i % 2 === 1) {
      desired.push('new');
      newLeft--;
    } else if (rng() < opts.masteredChance && kinds.mastered.length > 0) {
      desired.push('mastered');
    } else {
      desired.push('learning');
    }
  }
  // 홀수 자리에 못 채운 새 동작은 뒤에서부터 채움
  for (let i = opts.slots - 1; i >= 0 && newLeft > 0; i--) {
    if (desired[i] === 'learning') {
      desired[i] = 'new';
      newLeft--;
    }
  }

  const fallbackOrder: Record<Kind, Kind[]> = {
    learning: ['learning', 'new', 'mastered'],
    new: ['new', 'learning', 'mastered'],
    mastered: ['mastered', 'learning', 'new'],
  };

  for (let i = 0; i < opts.slots; i++) {
    const prevPart = result[i - 1]?.bodyPart;
    let pick: Exercise | null = null;

    if (i === 0 && totalDone === 0) {
      const first = pool.find((e) => e.isFirst);
      if (first) {
        pick = first;
        for (const k of ['learning', 'new', 'mastered'] as Kind[]) {
          queue[k] = queue[k].filter((e) => e.id !== first.id);
        }
      }
    }
    if (!pick) {
      for (const k of fallbackOrder[desired[i]]) {
        pick = take(k, prevPart);
        if (pick) break;
      }
    }
    // 후보가 슬롯보다 적으면 반복을 허용 (직전과 다른 동작을 우선)
    if (!pick) {
      const again = pool.filter((e) => e.id !== result[i - 1]?.id);
      const list = again.length > 0 ? again : pool;
      pick = list[Math.floor(rng() * list.length)];
    }
    result.push(pick);
  }
  return result;
}

/**
 * '다음 동작'으로 넘겼을 때 그 자리에 들어갈 다른 동작.
 * 같은 자세 후보 중 현재 목록에 없고, 앞뒤와 같은 부위가 아닌 것을 우선한다.
 */
export function pickReplacement(
  opts: RecommendOptions,
  currentIds: string[],
  slotIndex: number,
  neighborParts: (string | undefined)[],
): Exercise | null {
  const rng = opts.rng ?? Math.random;
  const pool = opts.exercises.filter((e) => e.active && e.postures.includes(opts.posture));
  if (pool.length === 0) return null;
  const skipped = [...(opts.skippedToday ?? []), currentIds[slotIndex]];

  const notInList = pool.filter((e) => !currentIds.includes(e.id));
  const candidates =
    notInList.length > 0 ? notInList : pool.filter((e) => e.id !== currentIds[slotIndex]);
  const list = candidates.length > 0 ? candidates : pool;

  const rank = (e: Exercise): number => {
    const count = opts.progress[e.id] ?? 0;
    const kind = kindOf(count, opts.masteredThreshold);
    const kindScore = kind === 'learning' ? 0 : kind === 'new' ? 1 : 2;
    const partPenalty = neighborParts.includes(e.bodyPart) ? 10 : 0;
    const skipPenalty = skipped.includes(e.id) ? 5 : 0;
    return kindScore + partPenalty + skipPenalty + rng() * 0.5;
  };
  return [...list].sort((a, b) => rank(a) - rank(b))[0];
}
