import { useState } from "react";
import { useAppStore } from "../stores/appStore";
import { useGenerate } from "../hooks/useGenerate";
import type { Template, TemplateVariable } from "../types";

export default function Editor() {
  const { currentTemplate, isGenerating, setIsGenerating, clearOutputText, setHistoryOpen } =
    useAppStore();
  const { generate } = useGenerate();
  const [values, setValues] = useState<Record<string, string>>({});

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!currentTemplate) return;
    clearOutputText();
    setIsGenerating(true);

    // 填充默认值
    const mergedVars: Record<string, string> = {};
    for (const v of currentTemplate.variables) {
      mergedVars[v.key] = values[v.key] || v.default || "";
    }

    await generate({
      template_id: currentTemplate.id,
      variables: mergedVars,
    });
  };

  if (!currentTemplate) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">
            WorkDocGen
          </h2>
          <p className="text-zinc-500 text-sm">
            从左侧选择一个功能开始使用
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-950 min-w-0">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentTemplate.icon}</span>
          <h2 className="text-sm font-semibold text-white">
            {currentTemplate.name}
          </h2>
          <span className="text-xs text-zinc-500">
            {currentTemplate.description}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors"
          >
            历史记录
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              isGenerating
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                生成中...
              </span>
            ) : (
              "生成"
            )}
          </button>
        </div>
      </div>

      {/* 变量输入区 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {currentTemplate.variables.map((v: TemplateVariable) => (
            <div key={v.key}>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {v.label}
                {v.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {v.type === "textarea" ? (
                <textarea
                  value={values[v.key] || ""}
                  onChange={(e) => handleValueChange(v.key, e.target.value)}
                  placeholder={v.placeholder}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-y transition-colors"
                />
              ) : v.type === "select" && v.options ? (
                <select
                  value={values[v.key] || v.default || ""}
                  onChange={(e) => handleValueChange(v.key, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                >
                  {v.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : v.type === "number" ? (
                <input
                  type="number"
                  value={values[v.key] || ""}
                  onChange={(e) => handleValueChange(v.key, e.target.value)}
                  placeholder={v.placeholder}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={values[v.key] || ""}
                  onChange={(e) => handleValueChange(v.key, e.target.value)}
                  placeholder={v.placeholder}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
