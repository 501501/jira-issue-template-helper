import React from 'react';
import {
  Box,
  Heading,
  HelperMessage,
  Label,
  RequiredAsterisk,
  Select,
  Stack,
  TextArea,
  Textfield,
} from '@forge/react';

function FieldRenderer({ field, value, onChange }) {
  const id = `field-${field.key}`;
  const labelNode = (
    <Label labelFor={id}>
      {field.label}
      {field.required ? <RequiredAsterisk /> : null}
    </Label>
  );

  if (field.type === 'textarea') {
    return (
      <Stack space="space.050">
        {labelNode}
        <TextArea
          id={id}
          name={field.key}
          isRequired={!!field.required}
          placeholder={field.placeholder || ''}
          defaultValue={value || ''}
          onChange={(e) => onChange(field.key, e && e.target ? e.target.value : '')}
        />
        {field.helper ? <HelperMessage>{field.helper}</HelperMessage> : null}
      </Stack>
    );
  }

  if (field.type === 'select') {
    const options = field.options || [];
    const selected = options.find((o) => o.value === value) || null;
    return (
      <Stack space="space.050">
        {labelNode}
        <Select
          inputId={id}
          name={field.key}
          isSearchable={false}
          isRequired={!!field.required}
          options={options}
          value={selected}
          placeholder={field.placeholder || '선택…'}
          onChange={(opt) => onChange(field.key, opt && opt.value)}
        />
      </Stack>
    );
  }

  return (
    <Stack space="space.050">
      {labelNode}
      <Textfield
        id={id}
        name={field.key}
        isRequired={!!field.required}
        placeholder={field.placeholder || ''}
        defaultValue={value || ''}
        onChange={(e) => onChange(field.key, e && e.target ? e.target.value : '')}
      />
      {field.helper ? <HelperMessage>{field.helper}</HelperMessage> : null}
    </Stack>
  );
}

/**
 * Renders a vertical stack of inputs derived from the chosen template.
 *
 * Text inputs intentionally use `defaultValue` instead of `value`.
 * Forge UI Kit text fields can interrupt Korean IME composition when
 * every keystroke is immediately pushed back through React state. We
 * still listen to `onChange` so validation, issue creation, and saved
 * templates receive the latest value, while the active input keeps
 * native IME control during typing.
 */
export default function IssueForm({ template, values, onFieldChange }) {
  if (!template) {
    return (
      <Box>
        <HelperMessage>위에서 템플릿을 먼저 선택해주세요.</HelperMessage>
      </Box>
    );
  }

  return (
    <Stack space="space.150">
      <Heading as="h3">{template.label} 입력 항목</Heading>
      {template.fields.map((field) => (
        <FieldRenderer
          key={`${template.id}-${field.key}`}
          field={field}
          value={values[field.key]}
          onChange={onFieldChange}
        />
      ))}
    </Stack>
  );
}
