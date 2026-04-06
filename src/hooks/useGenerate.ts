import { useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../stores/appStore";
import type { GenerationRequest, GenerationChunk } from "../types";

const FLUSH_INTERVAL_MS = 50;

export function useGenerate() {
  const store = useAppStore();
  const bufferRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 批量刷新 buffer 到 store（节流）
  const flushBuffer = useCallback(() => {
    if (bufferRef.current) {
      store.appendOutputText(bufferRef.current);
      bufferRef.current = "";
    }
  }, [store]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  const generate = async (
    request: GenerationRequest,
    providerId?: string,
  ) => {
    store.setIsGenerating(true);
    store.clearOutputText();
    bufferRef.current = "";

    // 启动定时批量刷新
    flushTimerRef.current = setInterval(flushBuffer, FLUSH_INTERVAL_MS);

    // 监听流式chunk
    const unlisten = await listen<GenerationChunk>(
      "generation-chunk",
      (event) => {
        const chunk = event.payload;
        if (chunk.done) {
          // 立即刷新剩余内容
          if (flushTimerRef.current) clearInterval(flushTimerRef.current);
          flushTimerRef.current = null;
          flushBuffer();
          store.setIsGenerating(false);
        } else {
          bufferRef.current += chunk.delta;
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
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
      flushBuffer();
      store.setOutputText(`\n\n--- 错误 ---\n${err}`);
    } finally {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
      store.setIsGenerating(false);
      unlisten();
    }
  };

  const stop = () => {
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    flushTimerRef.current = null;
    flushBuffer();
    store.setIsGenerating(false);
  };

  return { generate, stop };
}
