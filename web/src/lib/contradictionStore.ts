import { create } from "zustand";
import {
  DEFAULT_FEATURED_PAIR_ID,
  type ContradictionPair,
} from "@/lib/contradictionPairs";

type ContradictionState = {
  enabled: boolean;
  curatedPairs: ContradictionPair[];
  livePairs: ContradictionPair[];
  pairs: ContradictionPair[];
  selectedPairId: string | null;
  enable: () => void;
  disable: () => void;
  selectPair: (id: string | null) => void;
  setPairsFromApi: (curated: ContradictionPair[], live: ContradictionPair[]) => void;
};

function resolveDefaultPairId(
  all: ContradictionPair[],
  currentId: string | null,
): string | null {
  if (currentId && all.some((p) => p.id === currentId)) {
    return currentId;
  }
  if (all.some((p) => p.id === DEFAULT_FEATURED_PAIR_ID)) {
    return DEFAULT_FEATURED_PAIR_ID;
  }
  return all[0]?.id ?? null;
}

export const useContradictionStore = create<ContradictionState>((set) => ({
  enabled: false,
  curatedPairs: [],
  livePairs: [],
  pairs: [],
  selectedPairId: DEFAULT_FEATURED_PAIR_ID,

  enable: () =>
    set((state) => ({
      enabled: true,
      selectedPairId: resolveDefaultPairId(state.pairs, state.selectedPairId),
    })),

  disable: () => set({ enabled: false }),

  selectPair: (id) => set({ selectedPairId: id }),

  setPairsFromApi: (curated, live) =>
    set((state) => {
      const all = [...curated, ...live];
      return {
        curatedPairs: curated,
        livePairs: live,
        pairs: all,
        selectedPairId: resolveDefaultPairId(all, state.selectedPairId),
      };
    }),
}));
