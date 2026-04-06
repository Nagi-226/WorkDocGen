export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  required: boolean;
  placeholder?: string;
  default?: string;
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  variables: TemplateVariable[];
  system_prompt: string;
  user_prompt_template: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  base_url: string;
  default_model: string;
  models: string[];
}

export interface LlmProvider {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
  enabled: boolean;
}

export interface GenerationRequest {
  template_id: string;
  variables: Record<string, string>;
}

export interface GenerationChunk {
  id: string;
  delta: string;
  done: boolean;
}

export interface GenerationRecord {
  id: string;
  template_id: string;
  provider: string;
  model: string;
  variables: string;
  system_prompt: string;
  user_prompt: string;
  output: string;
  tokens_used: number;
  created_at: string;
}
