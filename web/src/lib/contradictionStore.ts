import { create } from "zustand";
import type { ContradictionPair } from "@/lib/contradictionPairs";

type ContradictionState = {
  enabled: boolean;
  pairs: ContradictionPair[];
  selectedPairId: string | null;
  enable: () => void;
  disable: () => void;
  selectPair: (id: string | null) => void;
  setPairs: (pairs: ContradictionPair[]) => void;
  loadPairs: (dynamicPairs: ContradictionPair[]) => void;
};

export const useContradictionStore = create<ContradictionState>((set) => ({
  enabled: false,
  pairs: [],
  selectedPairId: null,
  
  enable: () => set({ enabled: true }),
  
  disable: () => set({ enabled: false, selectedPairId: null }),
  
  selectPair: (id) => set({ selectedPairId: id }),
  
  setPairs: (pairs) => set({ pairs }),
  
  loadPairs: (dynamicPairs) =>
    set((state) => {
      const combined = [...state.pairs];
      for (const dynPair of dynamicPairs) {
        if (!combined.some((p) => p.id === dynPair.id)) {
          combined.push(dynPair);
        }
      }
      return { pairs: combined };
    }),
}));
