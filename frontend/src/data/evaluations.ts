import type { Severity } from '../types';

export const evaluationRuns = [
  { suite: 'Agent safety baseline', context: 'Baseline v6 · 186 examples · package 2.3.1', result: '96.8% pass · 3.2% drift', date: 'Today, 09:42', severity: 'success' as Severity },
  { suite: '24-hour MLflow trace drift', context: 'production-api-safety-traces · 1,284 sessions', result: '7.4% behavior drift', date: 'Today, 09:40', severity: 'warning' as Severity },
  { suite: 'Policy-mapped red team', context: '42 adversarial probes · 3 policy risks', result: '2 high residual risks', date: 'Today, 09:38', severity: 'danger' as Severity },
  { suite: 'Tool authorization probes', context: '24 scenarios · 3 tool groups', result: '2 failures', date: 'Yesterday, 16:12', severity: 'danger' as Severity },
];
