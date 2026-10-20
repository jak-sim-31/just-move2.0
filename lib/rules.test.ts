import { describe, expect, it } from 'vitest';
import { addDays, dateKey, diffDays, weekStartKey } from '@/lib/date';
import { creditedMinutes, dropsToGrant, isItemCompleted } from '@/lib/session';
import { addDrops, initialFarm, waterCrop } from '@/lib/farm';
import { buildPlaylist, pickReplacement } from '@/lib/recommend';
import { pickMessage, relationOf, restBucketOf, welcomeRestDays } from '@/lib/messages';
import { appConfig } from '@/lib/config';
import { EXERCISES, TIP_CARDS, WELCOME_MESSAGES } from '@/data/content';

describe('날짜 (KST)', () => {
  it('UTC 전날 15시 이후는 한국시간으로 다음 날', () => {
    expect(dateKey('2026-10-19T15:30:00Z')).toBe('2026-10-20');
    expect(dateKey('2026-10-19T14:59:00Z')).toBe('2026-10-19');
  });
  it('날짜 계산', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(diffDays('2026-10-01', '2026-10-20')).toBe(19);
    expect(weekStartKey('2026-10-20')).toBe('2026-10-19'); // 화요일 → 월요일
    expect(weekStartKey('2026-10-25')).toBe('2026-10-19'); // 일요일 → 그 주 월요일
  });
});

describe('인정 시간·물방울', () => {
  it('1·3·5분 단위로 내림', () => {
    expect(creditedMinutes(59)).toBe(0);
    expect(creditedMinutes(60)).toBe(1);
    expect(creditedMinutes(179)).toBe(1);
    expect(creditedMinutes(270)).toBe(3); // 4분 30초 → 3분
    expect(creditedMinutes(300)).toBe(5);
    expect(creditedMinutes(900)).toBe(5);
  });
  it('하루 5개 한도', () => {
    expect(dropsToGrant(3, 0, 5)).toBe(3);
    expect(dropsToGrant(5, 3, 5)).toBe(2);
    expect(dropsToGrant(5, 5, 5)).toBe(0);
    expect(dropsToGrant(1, 7, 5)).toBe(0);
  });
  it('동작 완료 판정', () => {
    expect(isItemCompleted(48, false, 60, 0.8)).toBe(true);
    expect(isItemCompleted(47, false, 60, 0.8)).toBe(false);
    expect(isItemCompleted(60, true, 60, 0.8)).toBe(false);
  });
});

describe('농장', () => {
  const tips = TIP_CARDS.map((t) => t.id);
  it('물방울이 없으면 물을 줄 수 없다', () => {
    expect(waterCrop(initialFarm, 7, tips).watered).toBe(false);
  });
  it('7번째 물주기에 수확하고 팁 카드를 연다', () => {
    let farm = addDrops(initialFarm, 7);
    for (let i = 0; i < 6; i++) {
      const r = waterCrop(farm, 7, tips);
      expect(r.harvested).toBe(false);
      farm = r.farm;
    }
    const last = waterCrop(farm, 7, tips);
    expect(last.harvested).toBe(true);
    expect(last.farm.harvestCount).toBe(1);
    expect(last.farm.cropProgress).toBe(0);
    expect(last.unlockedTipId).toBe(tips[0]);
  });
  it('하루 여러 번 수확 가능', () => {
    let farm = addDrops(initialFarm, 14);
    for (let i = 0; i < 14; i++) farm = waterCrop(farm, 7, tips).farm;
    expect(farm.harvestCount).toBe(2);
  });
});

describe('추천', () => {
  const base = {
    exercises: EXERCISES,
    progress: {} as Record<string, number>,
    masteredThreshold: appConfig.masteredThreshold,
    newRatio: appConfig.newRatio,
    masteredChance: 0,
  };
  it('선택한 자세의 동작만 나온다', () => {
    for (const posture of ['lying', 'sitting', 'standing', 'walking'] as const) {
      const list = buildPlaylist({ ...base, posture, slots: 5 });
      expect(list).toHaveLength(5);
      expect(list.every((e) => e.postures.includes(posture))).toBe(true);
    }
  });
  it('첫 사용자의 첫 동작은 첫 동작 지정 동작', () => {
    const list = buildPlaylist({ ...base, posture: 'sitting', slots: 3 });
    expect(list[0].isFirst).toBe(true);
  });
  it('익히는 중 동작을 먼저 추천한다 (1분)', () => {
    const progress = { 'sitting-03': 2, 'sitting-01': 1 };
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      seen.add(buildPlaylist({ ...base, progress, posture: 'sitting', slots: 1 })[0].id);
    }
    expect([...seen].every((id) => id in progress)).toBe(true);
  });
  it('같은 부위가 연속되지 않는다 (가능한 경우)', () => {
    const progress = Object.fromEntries(EXERCISES.map((e) => [e.id, 1]));
    for (let i = 0; i < 50; i++) {
      const list = buildPlaylist({ ...base, progress, posture: 'walking', slots: 5 });
      for (let k = 1; k < list.length; k++) {
        if (list[k].bodyPart === list[k - 1].bodyPart) {
          // 같은 부위 후보밖에 없는 경우만 허용
          const others = EXERCISES.filter(
            (e) => e.postures.includes('walking') && e.bodyPart !== list[k - 1].bodyPart,
          );
          expect(others.length).toBe(0);
        }
      }
    }
  });
  it('3·5분은 새 동작이 섞이고 목록 안에서 중복되지 않는다', () => {
    const progress = {
      'lying-01': 2, 'lying-02': 3, 'lying-03': 1, 'lying-04': 0, 'lying-05': 0,
    };
    for (let i = 0; i < 30; i++) {
      const list = buildPlaylist({ ...base, progress, posture: 'lying', slots: 3 });
      expect(new Set(list.map((e) => e.id)).size).toBe(3);
      expect(list.some((e) => (progress[e.id as keyof typeof progress] ?? 0) === 0)).toBe(true);
    }
  });
  it('다음 동작: 현재 목록에 없는 다른 동작으로 교체', () => {
    const list = buildPlaylist({ ...base, posture: 'standing', slots: 3 });
    const ids = list.map((e) => e.id);
    const rep = pickReplacement({ ...base, posture: 'standing', slots: 3 }, ids, 1, [
      list[0].bodyPart,
      list[2].bodyPart,
    ]);
    expect(rep).not.toBeNull();
    expect(ids).not.toContain(rep!.id);
  });
});

describe('환영', () => {
  it('어제 움직였으면 보이지 않는다', () => {
    expect(welcomeRestDays(['2026-10-19'], '2026-10-20', null)).toBeNull();
  });
  it('하루 쉬고 오면 쉰 날 1', () => {
    expect(welcomeRestDays(['2026-10-18'], '2026-10-20', null)).toBe(1);
  });
  it('이력이 없거나 오늘 이미 봤다면 보이지 않는다', () => {
    expect(welcomeRestDays([], '2026-10-20', null)).toBeNull();
    expect(welcomeRestDays(['2026-10-10'], '2026-10-20', '2026-10-20')).toBeNull();
  });
  it('휴식 기간·이용 관계 구분', () => {
    expect(restBucketOf(2)).toBe('1-2');
    expect(restBucketOf(3)).toBe('3+');
    expect(relationOf('2026-08-01', '2026-10-20', 20)).toBe('long');
    expect(relationOf('2026-08-01', '2026-10-20', 19)).toBe('other');
    expect(relationOf('2026-10-01', '2026-10-20', 25)).toBe('other');
  });
  it('최근 2개와 같은 문구는 피한다', () => {
    const group = WELCOME_MESSAGES.filter((m) => m.restBucket === '1-2' && m.relation === 'other');
    for (let i = 0; i < 30; i++) {
      const m = pickMessage(group, [group[0].id, group[1].id])!;
      expect(m.id).toBe(group[2].id);
    }
  });
  it('모든 문구 그룹에 문구가 있다', () => {
    for (const rest of ['1-2', '3+'] as const)
      for (const rel of ['long', 'other'] as const)
        expect(WELCOME_MESSAGES.some((m) => m.restBucket === rest && m.relation === rel)).toBe(true);
  });
});

describe('콘텐츠', () => {
  it('자세별 5개, 첫 동작 1개씩', () => {
    for (const p of ['lying', 'sitting', 'standing', 'walking'] as const) {
      const list = EXERCISES.filter((e) => e.postures.includes(p));
      expect(list).toHaveLength(5);
      expect(list.filter((e) => e.isFirst)).toHaveLength(1);
    }
  });
  it('운동 id는 중복되지 않는다', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });
});
