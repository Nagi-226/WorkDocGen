/// OpenAI兼容API的通用请求构建
/// 所有支持OpenAI格式的Provider共用此模块
/// 实际调用逻辑已集成在 prompt_engine.rs 的 generate_stream / generate_blocking 中

use serde_json::json;

/// 构建标准OpenAI Chat Completions请求体
pub fn build_chat_request(
    model: &str,
    messages: Vec<(String, String)>,
    max_tokens: u32,
    temperature: f32,
    stream: bool,
) -> serde_json::Value {
    json!({
        "model": model,
        "messages": messages.iter().map(|(role, content)| {
            json!({ "role": role, "content": content })
        }).collect::<Vec<_>>(),
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": stream,
    })
}
