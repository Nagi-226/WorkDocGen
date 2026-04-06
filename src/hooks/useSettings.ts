import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/appStore";
import type { LlmProvider, ProviderPreset } from "../types";

export function useSettings() {
  const store = useAppStore();

  const loadProviderPresets = async (): Promise<ProviderPreset[]> => {
    try {
      return await invoke<ProviderPreset[]>("get_provider_presets_cmd");
    } catch (err) {
      console.error("加载Provider预设失败:", err);
      return [];
    }
  };

  const saveProvider = async (provider: LlmProvider) => {
    try {
      await invoke("save_provider", { provider });
    } catch (err) {
      console.error("保存Provider失败:", err);
      throw err;
    }
  };

  const testConnection = async (
    provider: LlmProvider,
  ): Promise<{ ok: boolean; msg: string }> => {
    try {
      const msg = await invoke<string>("test_provider_connection", {
        provider,
      });
      return { ok: true, msg };
    } catch (err: any) {
      return { ok: false, msg: String(err) };
    }
  };

  return { loadProviderPresets, saveProvider, testConnection };
}
