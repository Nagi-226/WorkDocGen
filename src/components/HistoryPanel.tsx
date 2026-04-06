import { useEffect, useState } from "react";
import { useAppStore } from "../stores/appStore";
import { useHistory } from "../hooks/useHistory";
import type { GenerationRecord, Template } from "../types";

export default function HistoryPanel() {
  const { historyOpen, setHistoryOpen, history, setOutputText, templates, setCurrentTemplate } =
    useAppStore();
  const { loadHistory, deleteRecord } = useHistory();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (historyOpen) {
      loadHistory(100, 0);
    }
  }, [historyOpen]);

  if (!historyOpen) return null;

  const getTemplateName = (templateId: string) => {
    const t = templates.find((t) => t.id === templateId);
    return t ? `${t.icon} ${t.name}` : templateId;
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hour = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${month}-${day} ${hour}:${min}`;
    } catch {
      return iso;
    }
  };

  const handleView = (record: GenerationRecord) => {
    setOutputText(record.output);
    const tpl = templates.find((t) => t.id === record.template_id);
    if (tpl) setCurrentTemplate(tpl);
    setHistoryOpen(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[420px] bg-dark-950 border-l border-zinc-700 shadow-2xl flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">历史记录</h3>
        <button
          onClick={() => setHistoryOpen(false)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm">暂无历史记录</p>
          </div>
        ) : (
          history.map((record) => (
            <div
              key={record.id}
              className={`px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors cursor-pointer ${
                selected === record.id ? "bg-zinc-900" : ""
              }`}
              onClick={() => setSelected(record.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">
                  {getTemplateName(record.template_id)}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {record.model}
                </span>
              </div>
              <p className="text-xs text-zinc-300 line-clamp-2 mb-2">
                {record.output.slice(0, 100)}...
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">
                  {formatTime(record.created_at)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(record);
                    }}
                    className="px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-colors"
                  >
                    查看
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecord(record.id);
                    }}
                    className="px-2 py-0.5 text-[10px] text-zinc-500 border border-zinc-700 rounded hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
