use crate::models::provider::{LlmProvider, ProviderPreset, get_provider_presets};

/// LLM客户端：统一管理所有Provider
pub struct LlmClient {
    providers: Vec<LlmProvider>,
}

impl LlmClient {
    pub fn new() -> Self {
        Self {
            providers: Vec::new(),
        }
    }

    /// 从数据库设置加载Provider
    pub fn load_from_settings(&mut self, settings: &std::collections::HashMap<String, String>) {
        self.providers.clear();

        for preset in get_provider_presets() {
            let key = format!("provider_{}", preset.id);
            if let Some(json_str) = settings.get(&key) {
                if let Ok(provider) = serde_json::from_str::<LlmProvider>(json_str) {
                    if provider.enabled && !provider.api_key.is_empty() {
                        self.providers.push(provider);
                    }
                }
            }
        }
    }

    pub fn add_provider(&mut self, provider: LlmProvider) {
        // 移除同ID的旧配置
        self.providers.retain(|p| p.id != provider.id);
        if provider.enabled {
            self.providers.push(provider);
        }
    }

    pub fn get_providers(&self) -> &[LlmProvider] {
        &self.providers
    }

    pub fn get_provider(&self, id: &str) -> Option<&LlmProvider> {
        self.providers.iter().find(|p| p.id == id)
    }

    pub fn get_presets() -> Vec<ProviderPreset> {
        get_provider_presets()
    }

    /// 测试API连接
    pub async fn test_connection(provider: &LlmProvider) -> anyhow::Result<String> {
        let client = reqwest::Client::new();
        let url = format!("{}/chat/completions", provider.base_url.trim_end_matches('/'));

        let body = serde_json::json!({
            "model": provider.model,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 5,
            "temperature": 0,
            "stream": false,
        });

        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", provider.api_key))
            .header("Content-Type", "application/json")
            .timeout(std::time::Duration::from_secs(15))
            .json(&body)
            .send()
            .await?;

        if response.status().is_success() {
            Ok("连接成功".into())
        } else {
            let text = response.text().await.unwrap_or_default();
            Err(anyhow::anyhow!("连接失败: {}", text))
        }
    }
}
