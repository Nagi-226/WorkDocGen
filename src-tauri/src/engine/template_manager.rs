use crate::models::template::{Template, ValidationResult};
use std::collections::HashMap;
use std::path::PathBuf;

const GLOBAL_SYSTEM_PROMPT: &str =
    "你是一名资深软件工程师（10年以上经验），精通C/C++、嵌入式系统和软件架构设计。";

pub struct TemplateManager {
    templates: HashMap<String, Template>,
}

impl TemplateManager {
    pub fn new(templates_dir: PathBuf) -> anyhow::Result<Self> {
        let mut templates = HashMap::new();

        // 加载内置模板
        if templates_dir.exists() {
            for entry in std::fs::read_dir(&templates_dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.extension().map(|e| e == "json").unwrap_or(false) {
                    match Self::load_template(&path) {
                        Ok(t) => {
                            templates.insert(t.id.clone(), t);
                        }
                        Err(e) => {
                            eprintln!("Failed to load template {:?}: {}", path, e);
                        }
                    }
                }
            }
        }

        Ok(Self { templates })
    }

    fn load_template(path: &std::path::Path) -> anyhow::Result<Template> {
        let content = std::fs::read_to_string(path)?;
        let template: Template = serde_json::from_str(&content)?;
        Ok(template)
    }

    pub fn get_all(&self) -> Vec<Template> {
        self.templates.values().cloned().collect()
    }

    pub fn get_by_id(&self, id: &str) -> Option<Template> {
        self.templates.get(id).cloned()
    }

    pub fn get_global_system_prompt() -> &'static str {
        GLOBAL_SYSTEM_PROMPT
    }

    /// 验证用户提供的变量是否满足模板要求
    pub fn validate_variables(
        template: &Template,
        variables: &HashMap<String, String>,
    ) -> ValidationResult {
        let mut errors = Vec::new();

        for var in &template.variables {
            if var.required {
                match variables.get(&var.key) {
                    None => {
                        if var.default.is_none() {
                            errors.push(format!("必填字段「{}」缺失", var.label));
                        }
                    }
                    Some(val) if val.trim().is_empty() => {
                        if var.default.is_none() {
                            errors.push(format!("必填字段「{}」不能为空", var.label));
                        }
                    }
                    _ => {}
                }
            }
        }

        ValidationResult {
            valid: errors.is_empty(),
            errors,
        }
    }
}
