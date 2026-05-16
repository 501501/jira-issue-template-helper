import React from 'react';
import { Box, Heading, Select, Stack } from '@forge/react';

/**
 * Dropdown for picking a template (default + user-saved). Built-in
 * templates are flagged with a "(built-in)" suffix so the user knows
 * which ones came from defaults.
 */
export default function TemplateSelector({ templates, selectedId, onSelect }) {
  const options = (templates || []).map((t) => ({
    label: t.builtin === false ? `${t.label} (사용자)` : t.label,
    value: t.id,
  }));
  const value = options.find((o) => o.value === selectedId) || null;

  return (
    <Stack space="space.100">
      <Heading as="h3">템플릿</Heading>
      <Box>
        <Select
          isSearchable={false}
          options={options}
          value={value}
          placeholder="이슈 템플릿 선택"
          onChange={(opt) => onSelect && onSelect(opt && opt.value)}
        />
      </Box>
    </Stack>
  );
}
