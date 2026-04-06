use crate::engine::template_manager::TemplateManager;
use crate::models::template::Template;
use crate::models::provider::LlmProvider;
use crate::models::generation::GenerationChunk;
use chrono::Local;
use serde_json::{json, Value};
use std::collections::HashMap;

/// Chat Message
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Prompt渲染结果
#[derive(Debug)]
pub struct RenderedPrompt {
    pub system_prompt: String,
    pub user_prompt: String,
}

/// Prompt引擎：负责模板渲染与LLM调用编排
pub struct PromptEngine {
    template_manager: TemplateManager,
}

impl PromptEngine {
    pub fn new(template_manager: TemplateManager) -> Self {
        Self { template_manager }
    }

    pub fn get_all_templates(&self) -> Vec<Template> {
        self.template_manager.get_all()
    }

    pub fn get_template_by_id(&self, id: &str) -> Option<Template> {
        self.template_manager.get_by_id(id)
    }

    /// 渲染模板，替换变量占位符
    pub fn render(
        &self,
        template_id: &str,
        variables: &HashMap<String, String>,
    ) -> anyhow::Result<RenderedPrompt> {
        let template = self
            .template_manager
            .get_by_id(template_id)
            .ok_or_else(|| anyhow::anyhow!("模板不存在: {}", template_id))?;

        let validation =
            TemplateManager::validate_variables(&template, variables);
        if !validation.valid {
            return Err(anyhow::anyhow!(
                "变量校验失败: {}",
                validation.errors.join("; ")
            ));
        }

        let system_prompt = self.render_string(&template.system_prompt, variables);
        let user_prompt = self.render_string(&template.user_prompt_template, variables);

        Ok(RenderedPrompt {
            system_prompt,
            user_prompt,
        })
    }

    /// 字符串模板渲染，支持 {{var}} 和 {{date:format}} 占位符
    fn render_string(&self, template: &str, variables: &HashMap<String, String>) -> String {
        let mut result = template.to_string();

        // 替换 {{date:format}} 占位符
        let re = regex::Regex::new(r"\{\{date:([^}]+)\}\}").unwrap();
        result = re
            .replace_all(&result, |caps: &regex::Captures| {
                let format = &caps[1];
                let now = Local::now();
                match format.as_ref() {
                    "YYYY-MM-DD" => now.format("%Y-%m-%d").to_string(),
                    "YYYY-MM-DD HH:mm" => now.format("%Y-%m-%d %H:%M").to_string(),
                    "MM-DD" => now.format("%m-%d").to_string(),
                    "YYYY" => now.format("%Y").to_string(),
                    _ => now.format("%Y-%m-%d").to_string(),
                }
            })
            .to_string();

        // 替换 {{global:system_prompt}} 占位符
        result = result.replace(
            "{{global:system_prompt}}",
            TemplateManager::get_global_system_prompt(),
        );

        // 替换变量占位符
        for (key, value) in variables {
            let placeholder = format!("{{{{{}}}}}", key);
            let replacement = if value.trim().is_empty() {
                String::new()
            } else {
                value.clone()
            };
            result = result.replace(&placeholder, &replacement);
        }

        // 清理未替换的占位符（使用模板默认值或留空）
        let re = regex::Regex::new(r"\{\{(\w+)\}\}").unwrap();
        result = re.replace_all(&result, "").to_string();

        result
    }

    /// 构建发送给LLM的消息列表
    pub fn build_messages(
        system_prompt: &str,
        user_prompt: &str,
    ) -> Vec<ChatMessage> {
        let mut messages = Vec::new();
        if !system_prompt.is_empty() {
            messages.push(ChatMessage {
                role: "system".into(),
                content: system_prompt.to_string(),
            });
        }
        messages.push(ChatMessage {
            role: "user".into(),
            content: user_prompt.to_string(),
        });
        messages
    }

    /// 调用LLM API并流式返回结果
    pub async fn generate_stream(
        app_handle: tauri::AppHandle,
        request_id: &str,
        provider: &LlmProvider,
        messages: Vec<ChatMessage>,
    ) -> anyhow::Result<String> {
        use tauri::Emitter;

        let client = reqwest::Client::new();
        let url = format!("{}/chat/completions", provider.base_url.trim_end_matches('/'));

        let body = json!({
            "model": provider.model,
            "messages": messages.iter().map(|m| json!({
                "role": m.role,
                "content": m.content,
            })).collect::<Vec<Value>>(),
            "max_tokens": provider.max_tokens,
            "temperature": provider.temperature,
            "stream": true,
        });

        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", provider.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("LLM API错误 {}: {}", status, text));
        }

        let mut full_output = String::new();
        let mut stream = response.bytes_stream();

        use futures::StreamExt;
        let mut buffer = String::new();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            // 处理SSE格式数据
            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim().to_string();
                buffer = buffer[pos + 1..].to_string();

                if line.starts_with("data: ") {
                    let data = line[6..].trim();
                    if data == "[DONE]" {
                        let _ = app_handle.emit(
                            "generation-chunk",
                            GenerationChunk {
                                id: request_id.to_string(),
                                delta: String::new(),
                                done: true,
                            },
                        );
                        return Ok(full_output);
                    }

                    if let Ok(json) = serde_json::from_str::<Value>(data) {
                        if let Some(delta) = json
                            .pointer("/choices/0/delta/content")
                            .and_then(|v| v.as_str())
                        {
                            full_output.push_str(delta);
                            let _ = app_handle.emit(
                                "generation-chunk",
                                GenerationChunk {
                                    id: request_id.to_string(),
                                    delta: delta.to_string(),
                                    done: false,
                                },
                            );
                        }
                    }
                }
            }
        }

        let _ = app_handle.emit(
            "generation-chunk",
            GenerationChunk {
                id: request_id.to_string(),
                delta: String::new(),
                done: true,
            },
        );

        Ok(full_output)
    }

    /// 非流式调用LLM API
    pub async fn generate_blocking(
        provider: &LlmProvider,
        messages: Vec<ChatMessage>,
    ) -> anyhow::Result<String> {
        let client = reqwest::Client::new();
        let url = format!("{}/chat/completions", provider.base_url.trim_end_matches('/'));

        let body = json!({
            "model": provider.model,
            "messages": messages.iter().map(|m| json!({
                "role": m.role,
                "content": m.content,
            })).collect::<Vec<Value>>(),
            "max_tokens": provider.max_tokens,
            "temperature": provider.temperature,
            "stream": false,
        });

        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", provider.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("LLM API错误 {}: {}", status, text));
        }

        let json: Value = response.json().await?;
        json.pointer("/choices/0/message/content")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow::anyhow!("LLM返回格式异常"))
    }
}
