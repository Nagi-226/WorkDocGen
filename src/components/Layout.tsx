import { useEffect } from "react";
import { useAppStore } from "../stores/appStore";
import { useTemplates } from "../hooks/useTemplates";
import Sidebar from "../components/Sidebar";
import Editor from "../components/Editor";
import Preview from "../components/Preview";
import SettingsModal from "../components/SettingsModal";
import HistoryPanel from "../components/HistoryPanel";

export default function Layout() {
  const { sidebarOpen, toggleSidebar, setSettingsOpen } = useAppStore();
  const { loadTemplates } = useTemplates();

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="flex h-screen bg-dark-950 text-zinc-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          {/* 顶部栏 */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-dark-950 shrink-0">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              设置
            </button>
          </div>
          {/* 主内容区 */}
          <div className="flex-1 flex min-h-0">
            <Editor />
            <Preview />
          </div>
        </div>
      </div>
      <SettingsModal />
      <HistoryPanel />
    </div>
  );
}
