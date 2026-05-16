/**
 * Authoritative template definitions used by both resolvers and the
 * UI Kit 2 frontend. The frontend obtains them via the
 * `templates.getAll` resolver so that a single source of truth exists.
 */
export const defaultTemplates = [
  {
    id: 'bug',
    label: '버그',
    jiraIssueType: 'Bug',
    fields: [
      { key: 'summary', label: '요약', type: 'text', required: true },
      {
        key: 'stepsToReproduce',
        label: '재현 절차',
        type: 'textarea',
        required: true,
        placeholder: '1. ...\n2. ...\n3. ...',
      },
      {
        key: 'expectedResult',
        label: '기대 결과',
        type: 'textarea',
        required: true,
      },
      {
        key: 'actualResult',
        label: '실제 결과',
        type: 'textarea',
        required: true,
      },
      {
        key: 'environment',
        label: '환경',
        type: 'textarea',
        required: false,
        placeholder: 'OS / 브라우저 / 버전',
      },
    ],
  },
  {
    id: 'feature-request',
    label: '기능 요청',
    jiraIssueType: 'Task',
    fields: [
      { key: 'summary', label: '요약', type: 'text', required: true },
      {
        key: 'purpose',
        label: '목적 / 배경',
        type: 'textarea',
        required: true,
      },
      {
        key: 'requirements',
        label: '요구사항',
        type: 'textarea',
        required: true,
      },
      {
        key: 'acceptanceCriteria',
        label: '완료 기준',
        type: 'textarea',
        required: true,
        placeholder: 'Given … / When … / Then …',
      },
    ],
  },
  {
    id: 'qa-defect',
    label: 'QA 결함',
    jiraIssueType: 'Bug',
    fields: [
      { key: 'summary', label: '요약', type: 'text', required: true },
      {
        key: 'testEnvironment',
        label: '테스트 환경',
        type: 'textarea',
        required: true,
      },
      {
        key: 'triggerCondition',
        label: '발생 조건',
        type: 'textarea',
        required: true,
      },
      {
        key: 'severity',
        label: '심각도',
        type: 'select',
        required: true,
        options: [
          { label: '차단 (Blocker)', value: 'Blocker' },
          { label: '치명 (Critical)', value: 'Critical' },
          { label: '주요 (Major)', value: 'Major' },
          { label: '보통 (Minor)', value: 'Minor' },
          { label: '사소 (Trivial)', value: 'Trivial' },
        ],
      },
    ],
  },
];
