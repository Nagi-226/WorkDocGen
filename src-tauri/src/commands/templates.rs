use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_templates(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let engine = state.prompt_engine.lock().unwrap();
    let templates = engine.get_all_templates();
    Ok(templates.into_iter().map(|t| serde_json::to_value(t).unwrap()).collect())
}

#[tauri::command]
pub fn get_template_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<serde_json::Value, String> {
    let engine = state.prompt_engine.lock().unwrap();
    engine.get_template_by_id(&id)
        .map(|t| serde_json::to_value(t).unwrap())
        .ok_or_else(|| format!("模板不存在: {}", id))
}
