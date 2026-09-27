import { applications } from './applications';
import type { ViewId } from '../types';

export const viewTitles: Record<ViewId, string> = {
  applications: 'Application dashboard',
  overview: 'Safety profile',
  policy: 'Policy and risk',
  guardrails: 'Guardrails',
  evaluations: 'Safety evaluations',
  monitoring: 'Safety management',
};

export function getInitialApplicationId() {
  const match = typeof window === 'undefined' ? null : window.location.hash.match(/^#application\/([^/]+)$/);
  const requestedId = match?.[1];
  return applications.some((app) => app.id === requestedId) ? requestedId as string : applications[0].id;
}

export function getInitialView(): ViewId {
  const match = typeof window === 'undefined' ? null : window.location.hash.match(/^#application\/([^/]+)$/);
  return applications.some((app) => app.id === match?.[1]) ? 'overview' : 'applications';
}
