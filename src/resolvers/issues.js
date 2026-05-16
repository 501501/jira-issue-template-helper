import api, { route } from '@forge/api';

import { buildAdfDescription } from '../lib/adf.js';
import { validate } from '../lib/validation.js';
import { getAllTemplates } from './templates.js';

async function pickTemplate(templateId, fallback) {
  if (!templateId) return fallback;
  const templates = await getAllTemplates();
  const found = templates.find((t) => t.id === templateId);
  return found || fallback;
}

/**
 * Compose a "/browse/{key}" URL from the `self` URL Jira returns on a
 * successful create-issue call (which points at the REST endpoint).
 */
function browseUrlFromSelf(self, key) {
  if (!self || !key) return null;
  try {
    const u = new URL(self);
    return `${u.protocol}//${u.host}/browse/${key}`;
  } catch {
    return null;
  }
}

async function create({ projectKey, issueTypeId, issueTypeName, summary, fields, templateId }) {
  if (!projectKey) return { error: 'projectKey is required' };
  if (!summary) return { error: 'summary is required' };
  if (!issueTypeId && !issueTypeName) return { error: 'issueTypeId is required' };
  if (!fields || typeof fields !== 'object') {
    return { error: 'fields object is required' };
  }

  const fallback = { id: '__inline__', fields: Object.keys(fields).map((k) => ({ key: k, label: k })) };
  const template = await pickTemplate(templateId, fallback);
  const missing = validate(template, fields);
  if (missing.length > 0) {
    return {
      error: `Missing required fields: ${missing.join(', ')}`,
      missing,
    };
  }

  const description = buildAdfDescription(template, fields);

  const payload = {
    fields: {
      project: { key: projectKey },
      issuetype: issueTypeId ? { id: issueTypeId } : { name: issueTypeName },
      summary,
      description,
    },
  };

  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return {
      error: `Jira returned ${res.status} ${res.statusText}: ${text || '(empty body)'}`,
      status: res.status,
    };
  }

  const key = data && data.key;
  const self = data && data.self;
  return {
    key,
    self,
    browseUrl: browseUrlFromSelf(self, key),
  };
}

async function getSummary({ key }) {
  if (!key) return { error: 'key is required' };
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${key}?fields=summary`);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    return { error: `Jira returned ${res.status} ${res.statusText}` };
  }
  return { key, summary: data && data.fields ? data.fields.summary : null };
}

export function register(resolver) {
  resolver.define('issues.create', async (req) => create(req.payload || {}));
  resolver.define('issues.getSummary', async (req) => getSummary(req.payload || {}));
}
