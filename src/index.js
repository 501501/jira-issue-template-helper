import Resolver from '@forge/resolver';

import { register as registerTemplates } from './resolvers/templates.js';
import { register as registerIssues } from './resolvers/issues.js';
import { register as registerProjects } from './resolvers/projects.js';

const resolver = new Resolver();

registerTemplates(resolver);
registerIssues(resolver);
registerProjects(resolver);

export const handler = resolver.getDefinitions();
