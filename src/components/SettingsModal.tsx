import { useState, useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { useSettings } from "../hooks/useSettings";
import type { LlmProvider, ProviderPreset } from "../types";

export default function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    providers,
    updateProvider,
    addProvider,
  } = useAppStore();
  const { loadProviderPresets, saveProvider, testConnection } = useSettings();
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [presetsLoaded, setPresetsLoaded] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settingsOpen && !presetsLoaded) {
      loadProviderPresets().then((data) => {
        setPresets(data);
        setPresetsLoaded(true);
      });
    }
  }, [settingsOpen, presetsLoaded]);

  if (!settingsOpen) return null;

  const handlePresetSelect = (preset: ProviderPreset, index: number) => {
    const existing = providers[index];
    updateProvider(index, {
      id: preset.id,
      name: preset.name,
      base_url: preset.base_url,
      api_key: existing?.api_key || "",
      model: preset.default_model,
      max_tokens: existing?.max_tokens || 4096,
      temperature: existing?.temperature ?? 0.7,
      enabled: existing?.enabled || false,
    });
  };

  const handleAddProvider = () => {
    if (presets.length > providers.length) {
      const preset = presets[providers.length];
      addProvider({
        id: preset.id,
        name: preset.name,
        base_url: preset.base_url,
        api_key: "",
        model: preset.default_model,
        max_tokens: 4096,
        temperature: 0.7,
        enabled: false,
      });
    }
  };

  const handleUpdate = (index: number, field: keyof LlmProvider, value: any) => {
    const current = providers[index];
    if (current) {
      updateProvider(index, { ...current, [field]: value });
    }
  };

  const handleSave = async () => {
    for (const p of providers) {
      if (p.api_key) {
        await saveProvider(p);
      }
    }
    setSettingsOpen(false);
  };

  const handleTest = async (index: number) => {
    const p = providers[index];
    if (!p?.api_key) return;
    setTesting(p.id);
    const result = await testConnection(p);
    setTestResults((prev) => ({ ...prev, [p.id]: result.ok ? "连接成功" : result.msg }));
    setTesting(null);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "****";
    return key.slice(0, 4) + "****" + key.slice(-4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-dark-950 border border-zinc-700 rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">设置 - LLM Provider</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-zinc-500">
            配置至少一个LLM Provider以使用生成功能。支持OpenAI兼容API格式的所有模型。
          </p>

          {providers.map((p, i) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{p.name}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => handleUpdate(i, "enabled", e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-zinc-400">启用</span>
                  </label>
                  <button
                    onClick={() => handleTest(i)}
                    disabled={!p.api_key || testing === p.id}
                    className="px-2.5 py-1 text-xs border border-zinc-600 rounded text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  >
                    {testing === p.id ? "测试中..." : "测试连接"}
                  </button>
                </div>
              </div>

              {testResults[p.id] && (
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    testResults[p.id] === "连接成功"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {testResults[p.id]}
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1">API Key</label>
                <input
                  type="password"
                  value={p.api_key}
                  onChange={(e) => handleUpdate(i, "api_key", e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">模型</label>
                  <select
                    value={p.model}
                    onChange={(e) => handleUpdate(i, "model", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {presets
                      .find((ps) => ps.id === p.id)
                      ?.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Temperature</label>
                  <input
                    type="number"
                    value={p.temperature}
                    step={0.1}
                    min={0}
                    max={2}
                    onChange={(e) =>
                      handleUpdate(i, "temperature", parseFloat(e.target.value))
                    }
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Base URL</label>
                <input
                  type="text"
                  value={p.base_url}
                  onChange={(e) => handleUpdate(i, "base_url", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ))}

          {providers.length < presets.length && (
            <button
              onClick={handleAddProvider}
              className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              + 添加 Provider
            </button>
          )}
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-800">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
