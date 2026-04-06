import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/appStore";
import type { Template } from "../types";

export function useTemplates() {
  const store = useAppStore();

  const loadTemplates = async () => {
    try {
      const templates = await invoke<Template[]>("get_templates");
      store.setTemplates(templates);
    } catch (err) {
      console.error("加载模板失败:", err);
    }
  };

  return { loadTemplates };
}
