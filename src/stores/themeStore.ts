import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "mindaro" | "dark" | "federal";

export const THEME_OPTIONS: {
  id: ThemeId;
  swatches: [string, string, string];
}[] = [
  { id: "mindaro", swatches: ["#DDEB9D", "#FAF6E9", "#22333B"] },
  { id: "dark", swatches: ["#1c1c1c", "#fa3d3b", "#ffffff"] },
  { id: "federal", swatches: ["#07004D", "#DAEFB3", "#88304E"] },
];

interface ThemeState {
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
}

export function applyThemeToDom(themeId: ThemeId) {
  document.documentElement.setAttribute("data-theme", themeId);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors: Record<ThemeId, string> = {
      mindaro: "#DDEB9D",
      dark: "#1c1c1c",
      federal: "#DAEFB3",
    };
    meta.setAttribute("content", colors[themeId]);
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "mindaro",
      setThemeId: (themeId) => {
        applyThemeToDom(themeId);
        set({ themeId });
      },
    }),
    {
      name: "dimito-web-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.themeId) applyThemeToDom(state.themeId);
      },
    },
  ),
);
