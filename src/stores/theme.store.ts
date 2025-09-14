// src/store.ts

import { create } from "zustand";

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// create 함수를 사용해 스토어를 생성합니다.
export const useThemeStore = create<ThemeState>((set) => ({
  // 1. 초기 상태 (state)
  isDarkMode: false,

  // 2. 상태를 변경하는 액션 (action)
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
