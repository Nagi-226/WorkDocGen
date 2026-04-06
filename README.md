# WorkDocGen

> 开发者文档智能生成工具 | Tauri 2.x + React + Rust

一款面向开发者的 Windows 11 桌面工具，通过大模型API自动生成周报、简历、技术文档、Bug分析、Commit Message、PR描述、技术笔记和项目架构设计。

## 功能矩阵

| 功能 | 说明 |
|------|------|
| 周报生成 | 根据工作内容生成结构化周报 |
| 简历生成 | 根据个人信息生成专业开发者简历 |
| 技术文档生成 | 根据代码/模块描述生成技术设计文档 |
| Bug分析 | 根据Bug描述和日志进行根因分析 |
| Commit Message | 生成 Conventional Commits 格式的提交信息 |
| PR描述 | 生成结构化的 Pull Request 描述 |
| 技术笔记 | 将碎片笔记整理为系统化文档 |
| 项目架构 | 根据项目需求生成架构设计文档 |

## 支持的大模型

| Provider | 支持模型 |
|----------|---------|
| DeepSeek | deepseek-chat, deepseek-reasoner |
| GLM (智谱) | glm-4-flash, glm-4-plus, glm-4-long |
| Qwen (通义) | qwen-turbo, qwen-plus, qwen-max |
| OpenAI | gpt-4o-mini, gpt-4o, gpt-4-turbo |

> 所有使用 OpenAI 兼容 API 格式的模型均可接入。

## 技术栈

- **桌面框架**: Tauri 2.x (Rust)
- **前端**: React 18 + TypeScript + TailwindCSS
- **状态管理**: Zustand
- **Markdown**: react-markdown + remark-gfm
- **存储**: SQLite (rusqlite)
- **HTTP**: reqwest (streaming SSE)

## 前置条件

- [Rust](https://www.rust-lang.org/tools/install) >= 1.75
- [Node.js](https://nodejs.org/) >= 18
- Windows 10/11 (x64)
- Visual Studio Build Tools (C++ 编译环境)

## 快速开始

```bash
# 1. 安装前端依赖
npm install

# 2. 开发模式运行
npm run tauri dev

# 3. 构建发布版
npm run tauri build
```

## 首次使用

1. 启动应用后，点击右上角「设置」
2. 添加至少一个 LLM Provider，填入 API Key 并启用
3. 点击「测试连接」确认可用
4. 从左侧选择功能模板，填写内容，点击「生成」

## 项目结构

```
WorkDocGen/
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   ├── commands/            # Tauri 命令层
│   │   ├── engine/              # 核心引擎
│   │   │   ├── prompt_engine.rs # 模板渲染 + LLM 调用
│   │   │   ├── llm_client.rs    # Provider 管理
│   │   │   └── template_manager.rs
│   │   ├── models/              # 数据模型
│   │   ├── providers/           # LLM Provider 抽象
│   │   └── storage/             # SQLite 存储层
│   └── templates/               # 8 个 Prompt 模板 JSON
├── src/                         # React 前端
│   ├── components/              # UI 组件
│   ├── hooks/                   # 自定义 Hooks
│   ├── stores/                  # Zustand 状态管理
│   ├── types/                   # TypeScript 类型定义
│   └── styles/                  # 全局样式
└── docs/
    └── ARCHITECTURE.md          # 架构设计文档
```

## 架构设计

详见 [ARCHITECTURE.md](docs/ARCHITECTURE.md)

## License

MIT
