import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/appStore";
import type { GenerationRequest, GenerationChunk } from "../types";

export function useGenerate() {
  const store = useAppStore();

  const generate = async (
    request: GenerationRequest,
    providerId?: string,
  ) => {
    store.setIsGenerating(true);
    store.clearOutputText();

    // 监听流式chunk
    const unlisten = await listen<GenerationChunk>(
      "generation-chunk",
      (event) => {
        const chunk = event.payload;
        if (chunk.done) {
          store.setIsGenerating(false);
        } else {
          store.appendOutputText(chunk.delta);
        }
      },
    );

    try {
      let output: string;
      if (providerId) {
        output = await invoke<string>("generate_with_provider", {
          request,
          providerId,
        });
      } else {
        output = await invoke<string>("generate", { request });
      }
      // 如果流式输出为空（fallback到非流式），手动设置
      if (!store.outputText && output) {
        store.setOutputText(output);
      }
    } catch (err: any) {
      store.setOutputText(`\n\n--- 错误 ---\n${err}`);
    } finally {
      store.setIsGenerating(false);
      unlisten();
    }
  };

  const stop = () => {
    store.setIsGenerating(false);
  };

  return { generate, stop };
}
