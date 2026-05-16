import api, { route } from '@forge/api';

/**
 * List projects available to the calling user. Uses the paginated
 * `/rest/api/3/project/search` endpoint and returns up to 50 entries
 * (sufficient for a dropdown; a real product would paginate).
 */
async function list() {
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/project/search?maxResults=50&orderBy=name`, {
      headers: { Accept: 'application/json' },
    });
  const text = await res.text();
  if (!res.ok) {
    return { error: `Jira returned ${res.status} ${res.statusText}: ${text}` };
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { error: 'Failed to parse Jira response' };
  }
  const values = (data && Array.isArray(data.values)) ? data.values : [];
  const projects = values.map((p) => ({ key: p.key, name: p.name }));
  return { projects };
}

async function listIssueTypes({ projectKey }) {
  if (!projectKey) return { error: 'projectKey is required' };
  const res = await api
    .asUser()
    .requestJira(route`/rest/api/3/project/${projectKey}`, {
      headers: { Accept: 'application/json' },
    });
  const text = await res.text();
  if (!res.ok) {
    return { error: `Jira returned ${res.status} ${res.statusText}: ${text}` };
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return { error: 'Failed to parse Jira response' };
  }
  const types = (data && Array.isArray(data.issueTypes)) ? data.issueTypes : [];
  const issueTypes = types
    .filter((t) => !t.subtask)
    .map((t) => ({ id: t.id, name: t.name, iconUrl: t.iconUrl }));
  return { issueTypes };
}

export function register(resolver) {
  resolver.define('projects.list', async () => list());
  resolver.define('projects.listIssueTypes', async (req) => listIssueTypes(req.payload || {}));
}
