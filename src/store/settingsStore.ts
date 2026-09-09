/**
 * Settings Store
 *
 * App-level settings that persist across graph resets.
 * Separated from graphStore to prevent settings from being reset with the graph.
 * Uses zustand persist middleware to automatically save/load from localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME, type Theme } from "@/theme/constants";
import { STORE_NAME } from "../constants/store";

type RenderMode = 'svg' | 'canvas' | '3d';
export type EdgeVisibility = 'all' | 'dim' | 'hide';

interface SettingsState {
  theme: Theme;
  renderMode: RenderMode;
  edgeVisibility: EdgeVisibility;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setRenderMode: (mode: RenderMode) => void;
  setEdgeVisibility: (visibility: EdgeVisibility) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // State
      theme: THEME.SYSTEM,
      renderMode: 'svg' as RenderMode,
      edgeVisibility: 'all' as EdgeVisibility,

      // Actions
      setTheme: (theme) => {
        set({ theme });
      },
      setRenderMode: (renderMode) => {
        set({ renderMode });
      },
      setEdgeVisibility: (edgeVisibility) => {
        set({ edgeVisibility });
      },
    }),
    {
      name: STORE_NAME.SETTINGS,
    }
  )
);
