use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_history(
    state: State<'_, AppState>,
    limit: u32,
    offset: u32,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.database.lock().unwrap();
    db.get_generations(limit, offset)
        .map(|records| {
            records
                .into_iter()
                .map(|r| serde_json::to_value(r).unwrap())
                .collect()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_history(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    db.delete_generation(&id).map_err(|e| e.to_string())
}
