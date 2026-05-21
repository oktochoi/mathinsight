import { create } from 'zustand';

interface AppStore {
  dataVersion: number;
  bumpDataVersion: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  dataVersion: 0,
  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));
