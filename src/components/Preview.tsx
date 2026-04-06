import { useAppStore } from "../stores/appStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Preview() {
  const { outputText, isGenerating, setOutputText } = useAppStore();

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = outputText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleClear = () => {
    setOutputText("");
  };

  return (
    <div className="w-[480px] h-screen bg-dark-950 border-l border-zinc-800 flex flex-col shrink-0">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-300">输出预览</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!outputText}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            复制
          </button>
          <button
            onClick={handleClear}
            disabled={!outputText}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            清空
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {outputText ? (
          <div className={`markdown-preview ${isGenerating ? "generating-cursor" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {outputText}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-zinc-600 text-sm">
              {isGenerating ? "正在生成..." : "生成结果将显示在这里"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
