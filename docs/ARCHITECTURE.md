# WorkDocGen 架构设计文档

> 版本：v1.0 | 最后更新：2026-04-06

---

## 1. 项目概述

WorkDocGen 是一款面向开发者的 Windows 11 桌面工具，基于 **Tauri 2.x** 构架（Rust 后端 + React 前端），提供 8 大文档智能生成能力。核心理念：**模板驱动 + 多模型接入 + 本地存储**。

### 1.1 功能矩阵

| 功能 | 模板ID | 输入 | 输出 |
|------|--------|------|------|
| 周报生成 | `weekly_report` | 本周工作/下周计划/遇到问题 | 结构化周报 Markdown |
| 简历生成 | `resume` | 个人信息/技能/经历 | 专业简历 Markdown |
| 技术文档生成 | `tech_doc` | 代码/模块描述 | 技术设计文档 |
| Bug分析 | `bug_analysis` | Bug描述/日志/代码片段 | 根因分析+修复方案 |
| Commit Message生成 | `commit_msg` | 变更描述/文件列表 | Conventional Commits |
| PR描述生成 | `pr_desc` | 变更摘要/影响范围 | 结构化PR描述 |
| 技术笔记整理 | `tech_note` | 碎片笔记/关键词 | 系统化技术笔记 |
| 项目架构生成 | `architecture` | 项目描述/技术栈 | 架构设计文档 |

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Sidebar  │  │  Editor  │  │  Preview/Output  │  │
│  └─────┬────┘  └────┬─────┘  └────────┬─────────┘  │
│        │              │                 │            │
│  ┌─────┴──────────────┴─────────────────┴─────────┐ │
│  │              Tauri IPC Bridge                    │ │
│  │          (invoke / events)                       │ │
│  └──────────────────────┬──────────────────────────┘ │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────┐
│                  Rust Backend                        │
│  ┌──────────────────────┴──────────────────────────┐ │
│  │              Tauri Commands Layer                │ │
│  │   generate | templates | settings | history      │ │
│  └──────┬───────────┬──────────────┬───────────────┘ │
│         │           │              │                  │
│  ┌──────┴───┐ ┌─────┴──────┐ ┌────┴─────────────┐  │
│  │  Prompt   │ │   LLM      │ │   Storage        │  │
│  │  Engine   │ │   Client   │ │   (SQLite)       │  │
│  │           │ │            │ │                  │  │
│  │ Template  │ │ ┌────────┐ │ │ generations      │  │
│  │ Manager   │ │ │DeepSeek│ │ │ settings         │  │
│  │           │ │ │ GLM-4  │ │ │ templates        │  │
│  │ Variable  │ │ │ Qwen   │ │ │                  │  │
│  │ Resolver  │ │ │ OpenAI │ │ │                  │  │
│  └───────────┘ │ └────────┘ │ └──────────────────┘  │
│                └────────────┘                         │
└─────────────────────────────────────────────────────┘
```

### 2.1 分层职责

| 层级 | 职责 | 技术选型 |
|------|------|----------|
| **Frontend** | UI渲染、用户交互、Markdown预览 | React 18 + TypeScript + TailwindCSS |
| **IPC Bridge** | 前后端通信，序列化/反序列化 | Tauri invoke/events |
| **Commands** | 暴露给前端的可调用API | Tauri #[tauri::command] |
| **Engine** | 模板渲染、LLM调用编排 | 纯Rust |
| **Storage** | 持久化（生成历史、设置、模板） | rusqlite (SQLite) |

---

## 3. 核心模块设计

### 3.1 PromptEngine（提示词引擎）

```
PromptEngine
├── render(template_id, variables) -> String
│   ├── 加载模板JSON
│   ├── 解析变量占位符 {{var}}
│   ├── 替换变量值
│   └── 拼接 system_prompt + user_prompt
├── validate_variables(template_id, variables) -> Result
│   └── 检查必填字段、类型校验
└── register_template(template) -> Result
    └── 动态注册自定义模板
```

**变量替换规则**：
- `{{variable_key}}` → 用户输入值
- `{{date:YYYY-MM-DD}}` → 当前日期格式化
- `{{global:system_prompt}}` → 全局系统提示词
- 未提供变量 → 使用模板中的 `default` 值

### 3.2 LLMClient（大模型客户端）

```
LLMClient
├── chat(model, messages) -> Stream<Chunk>
│   ├── 构建HTTP请求（OpenAI兼容格式）
│   ├── 处理SSE流式响应
│   └── 超时与重试
├── list_providers() -> Vec<ProviderInfo>
└── test_connection(provider_id) -> Result
```

**Provider抽象**：所有模型统一走 OpenAI Chat Completions API 格式（`/v1/chat/completions`），差异仅在于 `base_url` 和 `auth_header`。

| Provider | base_url | auth_header |
|----------|----------|-------------|
| DeepSeek | `https://api.deepseek.com` | Bearer sk-xxx |
| GLM-4 (智谱) | `https://open.bigmodel.cn/api/paas` | Bearer xxx |
| Qwen (通义) | `https://dashscope.aliyuncs.com/compatible-mode` | Bearer sk-xxx |
| OpenAI | `https://api.openai.com` | Bearer sk-xxx |

### 3.3 TemplateManager（模板管理器）

```
TemplateManager
├── load_builtin() -> Vec<Template>
│   └── 从 app_data/templates/*.json 加载
├── load_custom() -> Vec<Template>
│   └── 从 user_data/custom_templates/*.json 加载
├── get_by_id(id) -> Template
├── save_custom(template) -> Result
├── delete_custom(id) -> Result
└── export_import(path) -> Result
```

### 3.4 Database（存储层）

SQLite表结构：

```sql
-- 生成历史
CREATE TABLE generations (
    id          TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    provider    TEXT NOT NULL,
    model       TEXT NOT NULL,
    variables   TEXT NOT NULL,  -- JSON
    system_prompt TEXT,
    user_prompt   TEXT,
    output      TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL
);

-- 设置
CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 自定义模板
CREATE TABLE custom_templates (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    content     TEXT NOT NULL,  -- JSON
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
```

---

## 4. 数据流

### 4.1 文档生成流程

```
用户输入 → 变量校验 → 模板渲染 → 构建Messages → 调用LLM API
                                                     ↓
Markdown渲染 ← 组装输出 ← 接收SSE流 ← 解析响应 ←──────┘
```

### 4.2 流式输出

LLM API返回SSE流，Rust端通过Tauri Event (`generation-chunk`) 逐块推送到前端，实现打字机效果。

```rust
// Rust端
app.emit("generation-chunk", GenerationChunk { id, delta })?;

// 前端
listen("generation-chunk", (event) => {
    appendToOutput(event.payload.delta);
});
```

---

## 5. 目录结构

```
WorkDocGen/
├── docs/
│   └── ARCHITECTURE.md          # 本文档
├── src-tauri/                   # Rust后端
│   ├── src/
│   │   ├── main.rs              # Tauri入口
│   │   ├── lib.rs               # 模块注册
│   │   ├── commands/            # Tauri命令
│   │   │   ├── mod.rs
│   │   │   ├── generate.rs
│   │   │   ├── templates.rs
│   │   │   ├── settings.rs
│   │   │   └── history.rs
│   │   ├── engine/              # 核心引擎
│   │   │   ├── mod.rs
│   │   │   ├── prompt_engine.rs
│   │   │   ├── llm_client.rs
│   │   │   └── template_manager.rs
│   │   ├── providers/           # LLM Provider
│   │   │   ├── mod.rs
│   │   │   └── openai_compat.rs
│   │   ├── storage/
│   │   │   ├── mod.rs
│   │   │   └── database.rs
│   │   └── models/
│   │       ├── mod.rs
│   │       ├── template.rs
│   │       ├── generation.rs
│   │       └── provider.rs
│   ├── templates/               # 内置Prompt模板
│   │   ├── weekly_report.json
│   │   ├── resume.json
│   │   ├── tech_doc.json
│   │   ├── bug_analysis.json
│   │   ├── commit_msg.json
│   │   ├── pr_desc.json
│   │   ├── tech_note.json
│   │   └── architecture.json
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                         # React前端
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   └── styles/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── README.md
```

---

## 6. 关键设计决策

### 6.1 为什么选择 Tauri

| 对比项 | Tauri | Electron |
|--------|-------|----------|
| 安装包大小 | ~5-10MB | ~150MB+ |
| 内存占用 | ~30-50MB | ~150-300MB |
| 安全性 | Rust沙箱，权限可控 | Node.js全权限 |
| 性能 | 原生级别 | Web级别 |
| 生态 | 成长中 | 成熟 |

### 6.2 OpenAI兼容API统一格式

所有主流国产大模型均已支持 OpenAI Chat Completions API 格式，因此只需要一个通用HTTP客户端，通过 `base_url` 区分不同Provider。

### 6.3 模板变量系统

采用 `{{mustache}}` 风格占位符，支持：
- 必填/选填标记
- 默认值
- 日期格式化宏
- 全局变量注入

---

## 7. 安全考虑

- API Key 存储在本地 SQLite，**不加密**（桌面工具，用户本地数据）
- 所有HTTP通信走 HTTPS
- LLM API调用不记录敏感内容到日志
- Tauri CSP 策略限制网络请求范围

---

## 8. 扩展方向

- [ ] 导出为 PDF/Word
- [ ] 模板市场（社区模板分享）
- [ ] 本地模型支持（Ollama）
- [ ] Git集成（自动获取commit/diff）
- [ ] 快捷键系统
- [ ] 多语言支持（i18n）
