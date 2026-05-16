/**
 * Convert template form values into a Jira ADF (Atlassian Document
 * Format) document. Each non-empty, non-`summary` field becomes a
 * heading (level 3) followed by a paragraph containing its value.
 */
export function buildAdfDescription(template, values) {
  const safeValues = values || {};
  const fields = template && Array.isArray(template.fields) ? template.fields : [];

  const content = [];
  for (const field of fields) {
    if (field.key === 'summary') continue;
    const raw = safeValues[field.key];
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (!text) continue;

    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: field.label || field.key }],
    });

    const paragraphs = text.split(/\r?\n\r?\n+/);
    for (const p of paragraphs) {
      const lines = p.split(/\r?\n/).filter((l) => l.length > 0);
      if (lines.length === 0) continue;
      const inlineContent = [];
      lines.forEach((line, idx) => {
        if (idx > 0) inlineContent.push({ type: 'hardBreak' });
        inlineContent.push({ type: 'text', text: line });
      });
      content.push({ type: 'paragraph', content: inlineContent });
    }
  }

  if (content.length === 0) {
    content.push({ type: 'paragraph', content: [{ type: 'text', text: ' ' }] });
  }

  return {
    version: 1,
    type: 'doc',
    content,
  };
}
