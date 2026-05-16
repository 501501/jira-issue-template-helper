import React, { useEffect, useMemo, useState } from 'react';
import ForgeReconciler, {
  Box,
  Button,
  ButtonGroup,
  Heading,
  Inline,
  Link,
  SectionMessage,
  Select,
  Spinner,
  Stack,
  Text,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';

import IssueForm from '../components/IssueForm';
import TemplateSelector from '../components/TemplateSelector';
import ValidationBanner from '../components/ValidationBanner';
import { validate } from '../lib/validation.js';

function defaultValuesFor(template) {
  if (!template) return {};
  const init = {};
  for (const f of template.fields) {
    init[f.key] = f.defaultValue || '';
  }
  return init;
}

function GlobalPageApp() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [values, setValues] = useState({});

  const [projects, setProjects] = useState([]);
  const [projectKey, setProjectKey] = useState(null);

  const [issueTypes, setIssueTypes] = useState([]);
  const [issueTypeId, setIssueTypeId] = useState(null);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);

  const [missing, setMissing] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdIssue, setCreatedIssue] = useState(null);
  const [siteUrl, setSiteUrl] = useState(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    view.getContext().then((ctx) => {
      if (!cancelled && ctx && ctx.siteUrl) setSiteUrl(ctx.siteUrl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  function pickPreferredIssueType(list, template) {
    if (!Array.isArray(list) || list.length === 0) return null;
    if (!template || !template.jiraIssueType) return list[0];

    const expectedName = String(template.jiraIssueType).toLowerCase();
    return list.find((t) => String(t.name || '').toLowerCase() === expectedName) || list[0];
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tpls, proj] = await Promise.all([
          invoke('templates.getAll'),
          invoke('projects.list'),
        ]);
        if (cancelled) return;
        const list = Array.isArray(tpls) ? tpls : [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateId(list[0].id);
          setValues(defaultValuesFor(list[0]));
        }
        if (proj && Array.isArray(proj.projects)) {
          setProjects(proj.projects);
          if (proj.projects.length > 0) setProjectKey(proj.projects[0].key);
        } else if (proj && proj.error) {
          setLoadError(proj.error);
        }
      } catch (err) {
        if (!cancelled) setLoadError(String(err && err.message ? err.message : err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectKey) {
      setIssueTypes([]);
      setIssueTypeId(null);
      return;
    }
    let cancelled = false;
    setLoadingIssueTypes(true);
    invoke('projects.listIssueTypes', { projectKey })
      .then((res) => {
        if (cancelled) return;
        const list = res && Array.isArray(res.issueTypes) ? res.issueTypes : [];
        setIssueTypes(list);
        setIssueTypeId((prev) => {
          if (prev && list.some((t) => t.id === prev)) return prev;
          const preferred = pickPreferredIssueType(list, selectedTemplate);
          return preferred ? preferred.id : null;
        });
      })
      .catch(() => {
        if (!cancelled) setIssueTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingIssueTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectKey]);

  useEffect(() => {
    const preferred = pickPreferredIssueType(issueTypes, selectedTemplate);
    setIssueTypeId(preferred ? preferred.id : null);
  }, [selectedTemplateId]);

  function onSelectTemplate(id) {
    setSelectedTemplateId(id);
    const next = templates.find((t) => t.id === id) || null;
    setValues(defaultValuesFor(next));
    const preferred = pickPreferredIssueType(issueTypes, next);
    setIssueTypeId(preferred ? preferred.id : null);
    setMissing([]);
    setCreatedIssue(null);
    setSubmitError(null);
  }

  function onFieldChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSaveTemplate() {
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    setSubmitError(null);
    try {
      const savedAt = new Date().toISOString();
      const isUserTemplate = selectedTemplate.builtin === false;
      const template = {
        id: isUserTemplate ? selectedTemplate.id : `${selectedTemplate.id}-saved-${Date.now()}`,
        label: isUserTemplate ? selectedTemplate.label : `${selectedTemplate.label} 저장본 ${savedAt.slice(0, 10)}`,
        jiraIssueType: selectedTemplate.jiraIssueType,
        fields: selectedTemplate.fields.map((field) => ({
          ...field,
          defaultValue: values[field.key] || '',
        })),
      };
      await invoke('templates.save', { template });
      const tpls = await invoke('templates.getAll');
      const list = Array.isArray(tpls) ? tpls : [];
      setTemplates(list);
      setSelectedTemplateId(template.id);
      setValues(defaultValuesFor(template));
      setMissing([]);
      setCreatedIssue(null);
    } catch (err) {
      setSubmitError(`템플릿 저장 실패: ${err && err.message ? err.message : err}`);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function onDeleteTemplate() {
    if (!selectedTemplate || selectedTemplate.builtin !== false) return;
    setDeletingTemplate(true);
    setSubmitError(null);
    try {
      await invoke('templates.delete', { templateId: selectedTemplate.id });
      const tpls = await invoke('templates.getAll');
      const list = Array.isArray(tpls) ? tpls : [];
      setTemplates(list);
      if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
        setValues(defaultValuesFor(list[0]));
      } else {
        setSelectedTemplateId(null);
        setValues({});
      }
      setMissing([]);
      setCreatedIssue(null);
    } catch (err) {
      setSubmitError(`템플릿 삭제 실패: ${err && err.message ? err.message : err}`);
    } finally {
      setDeletingTemplate(false);
    }
  }

  async function onCreate() {
    setSubmitError(null);
    setCreatedIssue(null);
    if (!selectedTemplate) {
      setSubmitError('먼저 템플릿을 선택하세요.');
      return;
    }
    if (!projectKey) {
      setSubmitError('Jira 프로젝트를 선택하세요.');
      return;
    }
    if (!issueTypeId) {
      setSubmitError('Jira 이슈 유형을 선택하세요.');
      return;
    }
    const errs = validate(selectedTemplate, values);
    setMissing(errs);
    if (errs.length > 0) return;

    setSubmitting(true);
    try {
      const res = await invoke('issues.create', {
        projectKey,
        issueTypeId,
        summary: values.summary,
        fields: values,
        templateId: selectedTemplate.id,
      });
      if (res && res.error) {
        setSubmitError(res.error);
      } else {
        setCreatedIssue(res);
      }
    } catch (err) {
      setSubmitError(String(err && err.message ? err.message : err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box padding="space.200">
        <Inline space="space.100" alignBlock="center">
          <Spinner />
          <Text>템플릿과 프로젝트를 불러오는 중…</Text>
        </Inline>
      </Box>
    );
  }

  const projectOptions = projects.map((p) => ({ label: `${p.name} (${p.key})`, value: p.key }));
  const projectValue = projectOptions.find((o) => o.value === projectKey) || null;

  const issueTypeOptions = issueTypes.map((t) => ({ label: t.name, value: t.id }));
  const issueTypeValue = issueTypeOptions.find((o) => o.value === issueTypeId) || null;
  const saveTemplateButtonText = selectedTemplate && selectedTemplate.builtin === false
    ? '선택한 저장 템플릿 수정'
    : '현재 입력값을 새 템플릿으로 저장';

  return (
    <Box padding="space.200">
      <Stack space="space.200">
        <Heading as="h2">템플릿으로 Jira 이슈 만들기</Heading>

        {loadError ? (
          <SectionMessage appearance="error" title="일부 데이터를 불러오지 못했습니다">
            <Text>{loadError}</Text>
          </SectionMessage>
        ) : null}

        <Stack space="space.100">
          <Heading as="h3">프로젝트</Heading>
          <Box>
            <Select
              isSearchable
              options={projectOptions}
              value={projectValue}
              placeholder="프로젝트 선택"
              onChange={(opt) => setProjectKey(opt && opt.value)}
            />
          </Box>
        </Stack>

        <Stack space="space.100">
          <Heading as="h3">이슈 유형</Heading>
          <Box>
            <Select
              isSearchable={false}
              options={issueTypeOptions}
              value={issueTypeValue}
              isDisabled={!projectKey || loadingIssueTypes || issueTypeOptions.length === 0}
              placeholder={
                !projectKey
                  ? '프로젝트를 먼저 선택하세요'
                  : loadingIssueTypes
                    ? '불러오는 중…'
                    : issueTypeOptions.length === 0
                      ? '사용 가능한 이슈 유형이 없습니다'
                      : '이슈 유형 선택'
              }
              onChange={(opt) => setIssueTypeId(opt && opt.value)}
            />
          </Box>
        </Stack>

        <TemplateSelector
          templates={templates}
          selectedId={selectedTemplateId}
          onSelect={onSelectTemplate}
        />

        <IssueForm
          template={selectedTemplate}
          values={values}
          onFieldChange={onFieldChange}
        />

        <ValidationBanner missing={missing} template={selectedTemplate} />

        {submitError ? (
          <SectionMessage appearance="error" title="이슈를 만들지 못했습니다">
            <Text>{submitError}</Text>
          </SectionMessage>
        ) : null}

        {createdIssue && createdIssue.key ? (() => {
          const browseUrl = siteUrl
            ? `${siteUrl.replace(/\/$/, '')}/browse/${createdIssue.key}`
            : createdIssue.browseUrl;
          return (
            <SectionMessage appearance="success" title={`이슈 ${createdIssue.key} 생성됨`}>
              <Text>
                {browseUrl ? (
                  <Link href={browseUrl} openNewTab>
                    Jira에서 {createdIssue.key} 열기
                  </Link>
                ) : (
                  `${createdIssue.key}로 생성됨`
                )}
              </Text>
            </SectionMessage>
          );
        })() : null}

        <Inline space="space.100">
          <ButtonGroup>
            <Button
              appearance="primary"
              isDisabled={submitting || !selectedTemplate || !projectKey || !issueTypeId}
              onClick={onCreate}
            >
              {submitting ? '만드는 중…' : '이슈 만들기'}
            </Button>
            <Button
              appearance="default"
              isDisabled={savingTemplate || !selectedTemplate}
              onClick={onSaveTemplate}
            >
              {savingTemplate ? '저장 중…' : saveTemplateButtonText}
            </Button>
            <Button
              appearance="subtle"
              isDisabled={deletingTemplate || !selectedTemplate || selectedTemplate.builtin !== false}
              onClick={onDeleteTemplate}
            >
              {deletingTemplate ? '삭제 중…' : '선택한 저장 템플릿 삭제'}
            </Button>
          </ButtonGroup>
        </Inline>
      </Stack>
    </Box>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <GlobalPageApp />
  </React.StrictMode>
);
