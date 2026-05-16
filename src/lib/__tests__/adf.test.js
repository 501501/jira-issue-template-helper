import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAdfDescription } from '../adf.js';

const template = {
  id: 'bug',
  fields: [
    { key: 'summary', label: '요약' },
    { key: 'stepsToReproduce', label: '재현 절차' },
    { key: 'expectedResult', label: '기대 결과' },
    { key: 'actualResult', label: '실제 결과' },
    { key: 'environment', label: '환경' },
  ],
};

test('ADF - 기본 형식 (version 1, doc, content[])', () => {
  const doc = buildAdfDescription(template, {
    summary: 'ignored',
    stepsToReproduce: '1. open\n2. click',
    expectedResult: 'works',
  });
  assert.equal(doc.version, 1);
  assert.equal(doc.type, 'doc');
  assert.ok(Array.isArray(doc.content));
});

test('ADF - summary 필드는 description에서 제외', () => {
  const doc = buildAdfDescription(template, { summary: 'should not appear', expectedResult: 'ok' });
  const text = JSON.stringify(doc);
  assert.ok(!text.includes('should not appear'));
  assert.ok(text.includes('ok'));
});

test('ADF - 비어있는/공백 값 필드는 스킵', () => {
  const doc = buildAdfDescription(template, {
    stepsToReproduce: 'a',
    expectedResult: '',
    actualResult: '   ',
    environment: undefined,
  });
  const headings = doc.content.filter((n) => n.type === 'heading');
  assert.equal(headings.length, 1);
  assert.equal(headings[0].content[0].text, '재현 절차');
});

test('ADF - 줄바꿈은 hardBreak 노드로 변환', () => {
  const doc = buildAdfDescription(template, {
    stepsToReproduce: 'line1\nline2\nline3',
  });
  const para = doc.content.find((n) => n.type === 'paragraph');
  assert.ok(para);
  const hardBreaks = para.content.filter((c) => c.type === 'hardBreak');
  assert.equal(hardBreaks.length, 2);
});

test('ADF - 빈 양식이면 placeholder 단락 1개', () => {
  const doc = buildAdfDescription(template, {});
  assert.equal(doc.content.length, 1);
  assert.equal(doc.content[0].type, 'paragraph');
});

test('ADF - 두 개 이상의 빈 줄은 단락 분리', () => {
  const doc = buildAdfDescription(template, {
    stepsToReproduce: 'a\n\nb',
  });
  const paragraphs = doc.content.filter((n) => n.type === 'paragraph');
  assert.equal(paragraphs.length, 2);
});

test('ADF - template 없으면 placeholder 단락만', () => {
  const doc = buildAdfDescription(null, { foo: 'bar' });
  assert.equal(doc.content.length, 1);
  assert.equal(doc.content[0].type, 'paragraph');
});
