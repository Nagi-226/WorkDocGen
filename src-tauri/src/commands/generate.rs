use crate::engine::prompt_engine::PromptEngine;
use crate::models::generation::{GenerationRequest, GenerationRecord};
use crate::AppState;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn generate(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    request: GenerationRequest,
) -> Result<String, String> {
    let request_id = Uuid::new_v4().to_string();

    // 1. 获取当前活跃的Provider
    let provider = {
        let client = state.llm_client.lock().unwrap();
        let providers = client.get_providers();
        providers.first().cloned().ok_or("未配置任何LLM Provider，请先在设置中配置API Key")?
    };

    // 2. 渲染Prompt
    let rendered = {
        let engine = state.prompt_engine.lock().unwrap();
        engine.render(&request.template_id, &request.variables)
            .map_err(|e| e.to_string())?
    };

    // 3. 构建消息
    let messages = PromptEngine::build_messages(
        &rendered.system_prompt,
        &rendered.user_prompt,
    );

    // 4. 流式调用LLM
    let output = PromptEngine::generate_stream(
        app,
        &request_id,
        &provider,
        messages,
    )
    .await
    .map_err(|e| e.to_string())?;

    // 5. 保存到数据库
    let variables_json = serde_json::to_string(&request.variables).unwrap_or_default();
    let record = GenerationRecord::new(
        &request.template_id,
        &provider.id,
        &provider.model,
        &variables_json,
        &rendered.system_prompt,
        &rendered.user_prompt,
        &output,
    );

    {
        let db = state.database.lock().unwrap();
        db.save_generation(&record).map_err(|e| e.to_string())?;
    }

    Ok(output)
}

#[tauri::command]
pub async fn generate_with_provider(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    request: GenerationRequest,
    provider_id: String,
) -> Result<String, String> {
    let request_id = Uuid::new_v4().to_string();

    // 1. 获取指定Provider
    let provider = {
        let client = state.llm_client.lock().unwrap();
        client.get_provider(&provider_id)
            .cloned()
            .ok_or(format!("Provider不存在或未启用: {}", provider_id))?
    };

    // 2. 渲染Prompt
    let rendered = {
        let engine = state.prompt_engine.lock().unwrap();
        engine.render(&request.template_id, &request.variables)
            .map_err(|e| e.to_string())?
    };

    // 3. 构建消息
    let messages = PromptEngine::build_messages(
        &rendered.system_prompt,
        &rendered.user_prompt,
    );

    // 4. 流式调用LLM
    let output = PromptEngine::generate_stream(
        app,
        &request_id,
        &provider,
        messages,
    )
    .await
    .map_err(|e| e.to_string())?;

    // 5. 保存到数据库
    let variables_json = serde_json::to_string(&request.variables).unwrap_or_default();
    let record = GenerationRecord::new(
        &request.template_id,
        &provider.id,
        &provider.model,
        &variables_json,
        &rendered.system_prompt,
        &rendered.user_prompt,
        &output,
    );

    {
        let db = state.database.lock().unwrap();
        db.save_generation(&record).map_err(|e| e.to_string())?;
    }

    Ok(output)
}
