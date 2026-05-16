import { kvs } from '@forge/kvs';

import { defaultTemplates } from '../lib/defaultTemplates.js';

const storage = kvs;
const STORAGE_KEY = 'user-templates';

function mergeBuiltinTemplate(base, override) {
  if (!override) return { ...base, builtin: true };

  const overrideFieldsByKey = new Map(
    Array.isArray(override.fields)
      ? override.fields.filter((field) => field && field.key).map((field) => [field.key, field])
      : []
  );

  return {
    ...base,
    builtin: true,
    // Built-in templates must keep their Korean labels and field
    // definitions. Older saved overrides may contain English labels
    // such as "Summary" or "Steps to Reproduce"; only carry over
    // per-field default values so existing saved input content is not
    // lost.
    fields: base.fields.map((field) => {
      const overrideField = overrideFieldsByKey.get(field.key);
      if (!overrideField || overrideField.defaultValue === undefined) return field;
      return { ...field, defaultValue: overrideField.defaultValue };
    }),
  };
}

/**
 * Read the merged list of templates: built-ins (always first) plus any
 * user-saved variants from Forge Storage. The storage payload is
 * expected to be an array of templates; if missing we return only the
 * built-ins.
 */
export async function getAllTemplates() {
  const stored = await storage.get(STORAGE_KEY);
  const userTemplates = Array.isArray(stored) ? stored : [];

  const builtinIds = new Set(defaultTemplates.map((t) => t.id));
  const overrides = userTemplates.filter((t) => t && builtinIds.has(t.id));
  const extras = userTemplates.filter((t) => t && !builtinIds.has(t.id));

  const merged = defaultTemplates.map((t) => {
    const override = overrides.find((o) => o.id === t.id);
    return mergeBuiltinTemplate(t, override);
  });

  return [...merged, ...extras.map((t) => ({ ...t, builtin: false }))];
}

/**
 * Save (insert/replace) a user template by id. Built-in template ids
 * are still allowed so the user can override default field lists.
 */
async function save({ template }) {
  if (!template || typeof template !== 'object') {
    return { error: 'template payload required' };
  }
  if (!template.id || typeof template.id !== 'string') {
    return { error: 'template.id is required (string)' };
  }
  if (!Array.isArray(template.fields) || template.fields.length === 0) {
    return { error: 'template.fields must be a non-empty array' };
  }

  const stored = await storage.get(STORAGE_KEY);
  const existing = Array.isArray(stored) ? stored : [];
  const next = existing.filter((t) => t && t.id !== template.id);
  next.push({
    id: template.id,
    label: template.label || template.id,
    jiraIssueType: template.jiraIssueType || 'Task',
    fields: template.fields,
  });
  await storage.set(STORAGE_KEY, next);
  return { ok: true, count: next.length };
}

async function deleteTemplate({ templateId }) {
  if (!templateId || typeof templateId !== 'string') {
    return { error: 'templateId is required (string)' };
  }

  const builtinIds = new Set(defaultTemplates.map((t) => t.id));
  if (builtinIds.has(templateId)) {
    return { error: '기본 템플릿은 삭제할 수 없습니다.' };
  }

  const stored = await storage.get(STORAGE_KEY);
  const existing = Array.isArray(stored) ? stored : [];
  const next = existing.filter((t) => t && t.id !== templateId);
  await storage.set(STORAGE_KEY, next);
  return { ok: true, count: next.length };
}

export function register(resolver) {
  resolver.define('templates.getAll', async () => getAllTemplates());
  resolver.define('templates.save', async (req) => save(req.payload || {}));
  resolver.define('templates.delete', async (req) => deleteTemplate(req.payload || {}));
}
