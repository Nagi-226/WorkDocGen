import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Template, LlmProvider, GenerationRecord } from "../types";

interface AppState {
  // 侧边栏
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // 当前选中的模板
  currentTemplate: Template | null;
  setCurrentTemplate: (t: Template | null) => void;

  // 模板列表
  templates: Template[];
  setTemplates: (t: Template[]) => void;

  // Provider列表
  providers: LlmProvider[];
  setProviders: (p: LlmProvider[]) => void;
  activeProviderId: string | null;
  setActiveProviderId: (id: string | null) => void;

  // 生成状态
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  outputText: string;
  setOutputText: (t: string) => void;
  appendOutputText: (t: string) => void;
  clearOutputText: () => void;

  // 历史记录
  history: GenerationRecord[];
  setHistory: (h: GenerationRecord[]) => void;

  // 设置面板
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;

  // 历史面板
  historyOpen: boolean;
  setHistoryOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      currentTemplate: null,
      setCurrentTemplate: (t) => set({ currentTemplate: t }),

      templates: [],
      setTemplates: (t) => set({ templates: t }),

      providers: [],
      setProviders: (p) => set({ providers: p }),
      updateProvider: (index: number, provider: LlmProvider) =>
        set((s) => {
          const updated = [...s.providers];
          updated[index] = provider;
          return { providers: updated };
        }),
      addProvider: (provider: LlmProvider) =>
        set((s) => ({ providers: [...s.providers, provider] })),
      activeProviderId: null,
      setActiveProviderId: (id) => set({ activeProviderId: id }),

      isGenerating: false,
      setIsGenerating: (v) => set({ isGenerating: v }),
      outputText: "",
      setOutputText: (t) => set({ outputText: t }),
      appendOutputText: (t) =>
        set((s) => ({ outputText: s.outputText + t })),
      clearOutputText: () => set({ outputText: "" }),

      history: [],
      setHistory: (h) => set({ history: h }),

      settingsOpen: false,
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      historyOpen: false,
      setHistoryOpen: (v) => set({ historyOpen: v }),
    }),
    {
      name: "workdocgen-store",
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
