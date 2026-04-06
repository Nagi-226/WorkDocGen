pub mod commands;
pub mod engine;
pub mod models;
pub mod providers;
pub mod storage;

use tauri::Manager;

use engine::llm_client::LlmClient;
use engine::prompt_engine::PromptEngine;
use engine::template_manager::TemplateManager;
use storage::database::Database;
use std::sync::Mutex;

pub struct AppState {
    pub database: Mutex<Database>,
    pub prompt_engine: Mutex<PromptEngine>,
    pub llm_client: Mutex<LlmClient>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("无法获取应用数据目录");

            std::fs::create_dir_all(&app_data_dir).expect("无法创建应用数据目录");

            // 初始化数据库
            let database = Database::new(app_data_dir.clone())
                .expect("数据库初始化失败");

            // 加载设置并初始化LLM客户端
            let settings = database
                .get_all_settings()
                .expect("读取设置失败");
            let mut llm_client = LlmClient::new();
            llm_client.load_from_settings(&settings);

            // 先确保模板目录存在，并从资源目录复制内置模板
            let templates_dir = app_data_dir.join("templates");
            if !templates_dir.exists() {
                std::fs::create_dir_all(&templates_dir).ok();
            }

            // 尝试从打包资源目录复制内置模板（仅首次）
            if let Ok(resource_dir) = app.path().resource_dir() {
                let bundled_templates: std::path::PathBuf = resource_dir.join("templates");
                if bundled_templates.exists() {
                    for entry in std::fs::read_dir(&bundled_templates).unwrap_or_else(|_| {
                        std::fs::read_dir(".").unwrap()
                    }) {
                        if let Ok(entry) = entry {
                            let src = entry.path();
                            let dest = templates_dir.join(entry.file_name());
                            if !dest.exists() {
                                std::fs::copy(&src, &dest).ok();
                            }
                        }
                    }
                }
            }

            // 如果模板目录仍为空（开发模式），从源码目录加载
            if templates_dir.read_dir().map(|mut d: std::fs::ReadDir| d.next().is_none()).unwrap_or(true) {
                let dev_templates = std::path::PathBuf::from("src-tauri/templates");
                if dev_templates.exists() {
                    for entry in std::fs::read_dir(&dev_templates).unwrap() {
                        if let Ok(entry) = entry {
                            let src = entry.path();
                            let dest = templates_dir.join(entry.file_name());
                            std::fs::copy(&src, &dest).ok();
                        }
                    }
                }
            }

            // 初始化模板管理器（此时模板文件已在app_data目录中）
            let template_manager = TemplateManager::new(templates_dir)
                .expect("模板加载失败");

            // 初始化Prompt引擎
            let prompt_engine = PromptEngine::new(template_manager);

            app.manage(AppState {
                database: Mutex::new(database),
                prompt_engine: Mutex::new(prompt_engine),
                llm_client: Mutex::new(llm_client),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::generate::generate,
            commands::generate::generate_with_provider,
            commands::templates::get_templates,
            commands::templates::get_template_by_id,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::get_provider_presets_cmd,
            commands::settings::save_provider,
            commands::settings::test_provider_connection,
            commands::history::get_history,
            commands::history::delete_history,
        ])
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}
