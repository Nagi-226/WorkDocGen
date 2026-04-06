use serde::{Deserialize, Serialize};

/// LLM Provider 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmProvider {
    pub id: String,
    pub name: String,
    #[serde(rename = "base_url")]
    pub base_url: String,
    #[serde(rename = "api_key")]
    pub api_key: String,
    pub model: String,
    #[serde(rename = "max_tokens")]
    pub max_tokens: u32,
    pub temperature: f32,
    pub enabled: bool,
}

impl Default for LlmProvider {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            base_url: String::new(),
            api_key: String::new(),
            model: String::from("deepseek-chat"),
            max_tokens: 4096,
            temperature: 0.7,
            enabled: false,
        }
    }
}

/// 预设Provider信息（不含API Key，用于UI展示）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderPreset {
    pub id: String,
    pub name: String,
    #[serde(rename = "base_url")]
    pub base_url: String,
    #[serde(rename = "default_model")]
    pub default_model: String,
    pub models: Vec<String>,
}

/// 获取预设Provider列表
pub fn get_provider_presets() -> Vec<ProviderPreset> {
    vec![
        ProviderPreset {
            id: "deepseek".into(),
            name: "DeepSeek".into(),
            base_url: "https://api.deepseek.com".into(),
            default_model: "deepseek-chat".into(),
            models: vec![
                "deepseek-chat".into(),
                "deepseek-reasoner".into(),
            ],
        },
        ProviderPreset {
            id: "glm".into(),
            name: "GLM (智谱)".into(),
            base_url: "https://open.bigmodel.cn/api/paas/v4".into(),
            default_model: "glm-4-flash".into(),
            models: vec![
                "glm-4-flash".into(),
                "glm-4-plus".into(),
                "glm-4-long".into(),
            ],
        },
        ProviderPreset {
            id: "qwen".into(),
            name: "Qwen (通义)".into(),
            base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1".into(),
            default_model: "qwen-turbo".into(),
            models: vec![
                "qwen-turbo".into(),
                "qwen-plus".into(),
                "qwen-max".into(),
            ],
        },
        ProviderPreset {
            id: "openai".into(),
            name: "OpenAI".into(),
            base_url: "https://api.openai.com/v1".into(),
            default_model: "gpt-4o-mini".into(),
            models: vec![
                "gpt-4o-mini".into(),
                "gpt-4o".into(),
                "gpt-4-turbo".into(),
            ],
        },
    ]
}
