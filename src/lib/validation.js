/**
 * Validate that all `required: true` fields of a template have a
 * non-empty value in the supplied form values map.
 *
 * @param {Object} template - one entry of defaultTemplates (must expose `fields`)
 * @param {Record<string, unknown>} values
 * @returns {string[]} the list of missing required field keys (empty when valid)
 */
export function validate(template, values) {
  if (!template || !Array.isArray(template.fields)) return [];
  const safeValues = values || {};
  const missing = [];
  for (const field of template.fields) {
    if (!field.required) continue;
    const v = safeValues[field.key];
    if (v === undefined || v === null) {
      missing.push(field.key);
      continue;
    }
    if (typeof v === 'string' && v.trim() === '') {
      missing.push(field.key);
    }
  }
  return missing;
}
