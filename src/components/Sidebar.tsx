import { useAppStore } from "../stores/appStore";

const templateIcons: Record<string, string> = {
  work: "📋",
  personal: "👤",
  tech: "🔧",
  git: "📝",
  doc: "📖",
};

export default function Sidebar() {
  const { templates, currentTemplate, setCurrentTemplate, sidebarOpen, toggleSidebar } =
    useAppStore();

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <aside
      className={`${
        sidebarOpen ? "w-60" : "w-0 overflow-hidden"
      } h-screen bg-dark-950 border-r border-zinc-800 transition-all duration-200 flex flex-col shrink-0`}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white tracking-tight">
            WorkDocGen
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">
            v1.0
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 模板列表 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {categories.map((cat) => (
          <div key={cat} className="mb-3">
            <div className="px-4 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              {cat === "work" ? "工作" : cat === "personal" ? "个人" : cat === "tech" ? "技术" : cat === "git" ? "Git" : "文档"}
            </div>
            {templates
              .filter((t) => t.category === cat)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTemplate(t)}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${
                    currentTemplate?.id === t.id
                      ? "bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-base shrink-0">{t.icon}</span>
                  <span className="text-sm truncate">{t.name}</span>
                </button>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
