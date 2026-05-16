import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validate } from '../validation.js';

const sampleTemplate = {
  id: 'bug',
  fields: [
    { key: 'summary', label: '요약', required: true },
    { key: 'stepsToReproduce', label: '재현 절차', required: true },
    { key: 'expectedResult', label: '기대 결과', required: true },
    { key: 'environment', label: '환경', required: false },
  ],
};

test('validate - 모든 필수값 누락', () => {
  const missing = validate(sampleTemplate, {});
  assert.deepEqual(missing.sort(), ['expectedResult', 'stepsToReproduce', 'summary'].sort());
});

test('validate - 모든 필수값 채워짐', () => {
  const missing = validate(sampleTemplate, {
    summary: 'a',
    stepsToReproduce: 'b',
    expectedResult: 'c',
  });
  assert.deepEqual(missing, []);
});

test('validate - 공백만 있는 값은 누락으로 처리', () => {
  const missing = validate(sampleTemplate, {
    summary: '   ',
    stepsToReproduce: 'b',
    expectedResult: 'c',
  });
  assert.deepEqual(missing, ['summary']);
});

test('validate - optional 필드는 비어있어도 통과', () => {
  const missing = validate(sampleTemplate, {
    summary: 'a',
    stepsToReproduce: 'b',
    expectedResult: 'c',
    environment: '',
  });
  assert.deepEqual(missing, []);
});

test('validate - null/undefined 값은 누락', () => {
  const missing = validate(sampleTemplate, {
    summary: null,
    stepsToReproduce: undefined,
    expectedResult: 'c',
  });
  assert.deepEqual(missing.sort(), ['stepsToReproduce', 'summary'].sort());
});

test('validate - template/values 안전 가드', () => {
  assert.deepEqual(validate(null, {}), []);
  assert.deepEqual(validate({ fields: null }, {}), []);
  assert.deepEqual(validate(sampleTemplate, null).sort(), ['expectedResult', 'stepsToReproduce', 'summary'].sort());
});
