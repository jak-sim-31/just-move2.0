export interface FarmState {
  /** 보유 중인(아직 쓰지 않은) 물방울 */
  drops: number;
  /** 현재 작물에 사용한 물방울 수 (0 ~ dropsPerHarvest-1) */
  cropProgress: number;
  /** 누적 수확 수 (바구니) */
  harvestCount: number;
  /** 오픈한 팁 카드 id (오픈 순서) */
  unlockedTipIds: string[];
}

export const initialFarm: FarmState = {
  drops: 0,
  cropProgress: 0,
  harvestCount: 0,
  unlockedTipIds: [],
};

export function addDrops(farm: FarmState, n: number): FarmState {
  return n > 0 ? { ...farm, drops: farm.drops + n } : farm;
}

export interface WaterResult {
  farm: FarmState;
  watered: boolean;
  harvested: boolean;
  unlockedTipId: string | null;
}

/**
 * 물방울 1개를 사용해 성장시킨다. 가득 차면 수확하고 팁 카드를 하나 연다.
 * 쉬었다고 줄어드는 규칙은 없다.
 */
export function waterCrop(
  farm: FarmState,
  dropsPerHarvest: number,
  allTipIds: string[],
): WaterResult {
  if (farm.drops <= 0) {
    return { farm, watered: false, harvested: false, unlockedTipId: null };
  }
  const progress = farm.cropProgress + 1;
  if (progress < dropsPerHarvest) {
    return {
      farm: { ...farm, drops: farm.drops - 1, cropProgress: progress },
      watered: true,
      harvested: false,
      unlockedTipId: null,
    };
  }
  const nextTip = allTipIds.find((id) => !farm.unlockedTipIds.includes(id)) ?? null;
  return {
    farm: {
      drops: farm.drops - 1,
      cropProgress: 0,
      harvestCount: farm.harvestCount + 1,
      unlockedTipIds: nextTip ? [...farm.unlockedTipIds, nextTip] : farm.unlockedTipIds,
    },
    watered: true,
    harvested: true,
    unlockedTipId: nextTip,
  };
}
