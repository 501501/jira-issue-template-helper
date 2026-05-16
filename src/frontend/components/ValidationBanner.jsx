import React from 'react';
import { SectionMessage, Text } from '@forge/react';

/**
 * Render a yellow warning banner that lists which template fields the
 * user must fill in before the issue can be created.
 *
 * Pass `template` so we can map raw field keys to their human-readable
 * labels.
 */
export default function ValidationBanner({ missing, template }) {
  if (!missing || missing.length === 0) return null;
  const fieldsByKey = {};
  if (template && Array.isArray(template.fields)) {
    for (const f of template.fields) fieldsByKey[f.key] = f.label || f.key;
  }
  const labels = missing.map((k) => fieldsByKey[k] || k);
  return (
    <SectionMessage appearance="warning" title="필수 입력 항목이 비어 있습니다">
      <Text>다음 항목을 입력하세요: {labels.join(', ')}</Text>
    </SectionMessage>
  );
}
