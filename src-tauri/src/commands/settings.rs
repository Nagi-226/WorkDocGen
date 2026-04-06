use crate::AppState;
use crate::engine::llm_client::LlmClient;
use crate::models::provider::{LlmProvider, get_provider_presets};
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<std::collections::HashMap<String, String>, String> {
    let db = state.database.lock().unwrap();
    db.get_all_settings().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(
    state: State<'_, AppState>,
    settings: std::collections::HashMap<String, String>,
) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    for (key, value) in &settings {
        db.set_setting(key, value).map_err(|e| e.to_string())?;
    }

    // 刷新LLM客户端
    {
        let all_settings = db.get_all_settings().map_err(|e| e.to_string())?;
        let mut client = state.llm_client.lock().unwrap();
        client.load_from_settings(&all_settings);
    }

    Ok(())
}

#[tauri::command]
pub fn get_provider_presets_cmd() -> Result<Vec<serde_json::Value>, String> {
    let presets = get_provider_presets();
    Ok(presets.into_iter().map(|p| serde_json::to_value(p).unwrap()).collect())
}

#[tauri::command]
pub fn save_provider(
    state: State<'_, AppState>,
    provider: LlmProvider,
) -> Result<(), String> {
    let key = format!("provider_{}", provider.id);
    let value = serde_json::to_string(&provider).map_err(|e| e.to_string())?;

    let db = state.database.lock().unwrap();
    db.set_setting(&key, &value).map_err(|e| e.to_string())?;

    // 刷新LLM客户端
    {
        let all_settings = db.get_all_settings().map_err(|e| e.to_string())?;
        let mut client = state.llm_client.lock().unwrap();
        client.load_from_settings(&all_settings);
    }

    Ok(())
}

#[tauri::command]
pub async fn test_provider_connection(
    provider: LlmProvider,
) -> Result<String, String> {
    LlmClient::test_connection(&provider).await.map_err(|e| e.to_string())
}
