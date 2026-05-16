import { test } from 'node:test';
import assert from 'node:assert/strict';

import { defaultTemplates } from '../defaultTemplates.js';

test('defaultTemplates - 3종 (bug / feature-request / qa-defect)', () => {
  const ids = defaultTemplates.map((t) => t.id).sort();
  assert.deepEqual(ids, ['bug', 'feature-request', 'qa-defect']);
});

test('defaultTemplates - 모든 템플릿이 summary(필수)와 jiraIssueType을 가진다', () => {
  for (const t of defaultTemplates) {
    const summary = t.fields.find((f) => f.key === 'summary');
    assert.ok(summary, `${t.id} 에 summary 필드가 있어야 함`);
    assert.equal(summary.required, true, `${t.id}.summary 는 required여야 함`);
    assert.ok(t.jiraIssueType, `${t.id} 에 jiraIssueType 이 있어야 함`);
    assert.ok(t.label, `${t.id} 에 label 이 있어야 함`);
  }
});

test('defaultTemplates - bug 템플릿의 한국어 라벨', () => {
  const bug = defaultTemplates.find((t) => t.id === 'bug');
  assert.equal(bug.label, '버그');
  assert.ok(bug.fields.find((f) => f.label === '재현 절차'));
  assert.ok(bug.fields.find((f) => f.label === '기대 결과'));
});

test('defaultTemplates - qa-defect severity 옵션 5종', () => {
  const qa = defaultTemplates.find((t) => t.id === 'qa-defect');
  const severity = qa.fields.find((f) => f.key === 'severity');
  assert.equal(severity.type, 'select');
  assert.equal(severity.options.length, 5);
  const values = severity.options.map((o) => o.value).sort();
  assert.deepEqual(values, ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial']);
});
