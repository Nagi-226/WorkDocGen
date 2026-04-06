import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../stores/appStore";
import type { GenerationRecord } from "../types";

export function useHistory() {
  const store = useAppStore();

  const loadHistory = async (limit = 50, offset = 0) => {
    try {
      const records = await invoke<GenerationRecord[]>("get_history", {
        limit,
        offset,
      });
      store.setHistory(records);
    } catch (err) {
      console.error("加载历史记录失败:", err);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await invoke("delete_history", { id });
      await loadHistory();
    } catch (err) {
      console.error("删除历史记录失败:", err);
    }
  };

  return { loadHistory, deleteRecord };
}
