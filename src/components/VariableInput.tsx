import type { TemplateVariable } from "../types";

const baseClasses =
  "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors";

interface VariableInputProps {
  variable: TemplateVariable;
  value: string;
  onChange: (key: string, value: string) => void;
}

export default function VariableInput({ variable: v, value, onChange }: VariableInputProps) {
  if (v.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(v.key, e.target.value)}
        placeholder={v.placeholder}
        rows={4}
        className={`${baseClasses} resize-y`}
      />
    );
  }

  if (v.type === "select" && v.options) {
    return (
      <select
        value={value || v.default || ""}
        onChange={(e) => onChange(v.key, e.target.value)}
        className={baseClasses}
      >
        {v.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (v.type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(v.key, e.target.value)}
        placeholder={v.placeholder}
        className={baseClasses}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(v.key, e.target.value)}
      placeholder={v.placeholder}
      className={baseClasses}
    />
  );
}
