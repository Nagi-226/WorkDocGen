use chrono::Utc;
use serde::{Deserialize, Serialize};

/// 生成请求
#[derive(Debug, Serialize, Deserialize)]
pub struct GenerationRequest {
    pub template_id: String,
    pub variables: std::collections::HashMap<String, String>,
}

/// 流式生成chunk
#[derive(Debug, Clone, Serialize)]
pub struct GenerationChunk {
    pub id: String,
    pub delta: String,
    pub done: bool,
}

/// 生成历史记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRecord {
    pub id: String,
    pub template_id: String,
    pub provider: String,
    pub model: String,
    pub variables: String,
    pub system_prompt: String,
    pub user_prompt: String,
    pub output: String,
    pub tokens_used: u32,
    pub created_at: String,
}

impl GenerationRecord {
    pub fn new(
        template_id: &str,
        provider: &str,
        model: &str,
        variables: &str,
        system_prompt: &str,
        user_prompt: &str,
        output: &str,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            template_id: template_id.to_string(),
            provider: provider.to_string(),
            model: model.to_string(),
            variables: variables.to_string(),
            system_prompt: system_prompt.to_string(),
            user_prompt: user_prompt.to_string(),
            output: output.to_string(),
            tokens_used: 0,
            created_at: Utc::now().to_rfc3339(),
        }
    }
}
