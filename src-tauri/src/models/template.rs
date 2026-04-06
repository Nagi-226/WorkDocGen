use serde::{Deserialize, Serialize};

/// Prompt模板中的变量定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub key: String,
    pub label: String,
    #[serde(rename = "type")]
    pub var_type: String,
    pub required: bool,
    #[serde(default)]
    pub placeholder: String,
    #[serde(default)]
    pub default: Option<String>,
}

/// Prompt模板
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub icon: String,
    pub variables: Vec<TemplateVariable>,
    #[serde(rename = "system_prompt")]
    pub system_prompt: String,
    #[serde(rename = "user_prompt_template")]
    pub user_prompt_template: String,
}

/// 模板验证结果
#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
}
