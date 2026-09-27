import { findings } from './applications';
import type { PolicyDocument, Severity, YamlConfig, YamlValue } from '../types';

export const initialPolicyDocuments: PolicyDocument[] = [
  {
    id: 'policy-customer-data',
    title: 'Customer data handling policy',
    version: 'v4',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 25, 2026',
  },
  {
    id: 'policy-responsible-ai',
    title: 'Responsible AI use standard',
    version: 'v2',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 18, 2026',
  },
  {
    id: 'policy-agent-security',
    title: 'Agent tool access and security policy',
    version: 'v1',
    source: 'Structured assertions · adapter',
    scope: 'All projects/workspaces',
    status: 'Draft',
    createdAt: 'Sep 12, 2026',
  },
  {
    id: 'policy-content-safety',
    title: 'Prompt injection and content safety standard',
    version: 'v3',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 10, 2026',
  },
  {
    id: 'policy-evaluation-governance',
    title: 'AI model evaluation and release policy',
    version: 'v2',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'production-api',
    status: 'Draft',
    createdAt: 'Sep 08, 2026',
  },
  {
    id: 'policy-third-party-risk',
    title: 'Third-party model risk assessment',
    version: 'v1',
    source: 'Structured assertions · adapter',
    scope: 'All projects/workspaces',
    status: 'Draft',
    createdAt: 'Sep 05, 2026',
  },
  {
    id: 'policy-data-retention',
    title: 'AI data retention and deletion standard',
    version: 'v5',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Aug 28, 2026',
  },
  {
    id: 'policy-human-review',
    title: 'Human review and escalation procedure',
    version: 'v2',
    source: 'Structured assertions · adapter',
    scope: 'secure-development',
    status: 'Draft',
    createdAt: 'Aug 22, 2026',
  },
  {
    id: 'policy-agent-lifecycle',
    title: 'Agent lifecycle and change management policy',
    version: 'v1',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'coding-agents',
    status: 'Draft',
    createdAt: 'Aug 18, 2026',
  },
  {
    id: 'policy-eu-ai-act',
    title: 'EU AI Act',
    version: '2024/1689',
    source: 'External regulation · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Draft',
    createdAt: 'Sep 26, 2026',
  },
  {
    id: 'policy-iso-42001',
    title: 'ISO/IEC 42001:2023 AI management system',
    version: '2023 edition',
    source: 'External standard · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 26, 2026',
  },
  {
    id: 'policy-aaup',
    title: 'AI Acceptable Use Policy (AAUP)',
    version: 'v1.2',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 24, 2026',
  },
  {
    id: 'policy-data-privacy-security',
    title: 'AI Data Privacy & Security Policy',
    version: 'v2.1',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Active',
    createdAt: 'Sep 23, 2026',
  },
  {
    id: 'policy-transparency-explainability',
    title: 'AI Transparency & Explainability Policy',
    version: 'v1.0',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Draft',
    createdAt: 'Sep 22, 2026',
  },
  {
    id: 'policy-bias-fairness',
    title: 'AI Bias & Fairness Policy',
    version: 'v0.9',
    source: 'Policy document · ASAGO Policy Mapper',
    scope: 'All projects/workspaces',
    status: 'Draft',
    createdAt: 'Sep 20, 2026',
  },
];

export const policyMappingRecords = [
  ...findings.map((item, index) => ({
    ...item,
    policyIds: index === 0
      ? ['policy-agent-security', 'policy-aaup', 'policy-eu-ai-act']
      : index === 1
        ? ['policy-responsible-ai', 'policy-aaup', 'policy-eu-ai-act']
        : ['policy-customer-data', 'policy-data-privacy-security', 'policy-eu-ai-act'],
  })),
  {
    clause: 'AI-GOV-01 · Accountable ownership',
    requirement: 'Assign an accountable owner for each AI system and its material risks.',
    risk: 'Unclear risk accountability',
    evidence: 'Owner recorded for 7 of 9 workflows',
    severity: 'success' as Severity,
    status: 'Approved',
    policyIds: ['policy-responsible-ai', 'policy-iso-42001'],
  },
  {
    clause: 'AI-DATA-03 · Source authorization',
    requirement: 'Use only data sources approved for the system purpose and user context.',
    risk: 'Unauthorized data retrieval',
    evidence: 'Two connectors need access review',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-customer-data', 'policy-data-privacy-security'],
  },
  {
    clause: 'AI-SEC-06 · Tool validation',
    requirement: 'Validate tool names, arguments, and permissions before execution.',
    risk: 'Excessive agent autonomy',
    evidence: 'Schema checks cover 18 of 24 tools',
    severity: 'warning' as Severity,
    status: 'Partial coverage',
    policyIds: ['policy-agent-security', 'policy-aaup', 'policy-eu-ai-act'],
  },
  {
    clause: 'AI-SEC-08 · Credential protection',
    requirement: 'Prevent secrets and credentials from entering prompts or model outputs.',
    risk: 'Credential disclosure',
    evidence: 'Secret scanning not evaluated on tool results',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-agent-security', 'policy-data-privacy-security'],
  },
  {
    clause: 'AI-SAF-03 · Harmful content',
    requirement: 'Detect and prevent disallowed harmful content in inputs and outputs.',
    risk: 'Harmful content generation',
    evidence: 'Safety suite · 240 scenarios · 98% pass',
    severity: 'success' as Severity,
    status: 'Approved',
    policyIds: ['policy-responsible-ai', 'policy-aaup'],
  },
  {
    clause: 'AI-SAF-09 · Refusal consistency',
    requirement: 'Apply safety refusals consistently across supported languages and formats.',
    risk: 'Policy evasion across modalities',
    evidence: 'Multilingual evaluation is pending',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-responsible-ai', 'policy-aaup'],
  },
  {
    clause: 'AI-PRIV-04 · Data minimization',
    requirement: 'Limit personal data processing to what is necessary for the declared purpose.',
    risk: 'Excessive personal data processing',
    evidence: 'Input masking tested; retrieval path remains open',
    severity: 'warning' as Severity,
    status: 'Partial coverage',
    policyIds: ['policy-customer-data', 'policy-data-privacy-security', 'policy-eu-ai-act'],
  },
  {
    clause: 'AI-TRANS-02 · User disclosure',
    requirement: 'Inform users when they interact with AI-generated content or systems.',
    risk: 'Undisclosed AI interaction',
    evidence: 'Disclosure appears in the application entry flow',
    severity: 'success' as Severity,
    status: 'Approved',
    policyIds: ['policy-responsible-ai', 'policy-transparency-explainability', 'policy-eu-ai-act'],
  },
  {
    clause: 'AI-ROB-01 · Service resilience',
    requirement: 'Maintain safe behavior during overload, dependency failure, or degraded service.',
    risk: 'Unsafe fallback behavior',
    evidence: 'Fallback path has no current safety evaluation',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-responsible-ai', 'policy-iso-42001'],
  },
  {
    clause: 'AI-OPS-05 · Human escalation',
    requirement: 'Route high-impact or uncertain decisions to an authorized human reviewer.',
    risk: 'Unreviewed high-impact decision',
    evidence: 'No mapped control for the escalation path',
    severity: 'info' as Severity,
    status: 'Unmapped',
    policyIds: ['policy-responsible-ai', 'policy-eu-ai-act'],
  },
  {
    clause: 'AI-SAF-15 · Factual grounding',
    requirement: 'Ground factual responses in approved evidence and identify unsupported claims.',
    risk: 'Unsupported or fabricated output',
    evidence: 'RAG checks cover 4 of 6 response workflows',
    severity: 'warning' as Severity,
    status: 'Partial coverage',
    policyIds: ['policy-responsible-ai', 'policy-transparency-explainability'],
  },
  {
    clause: 'AI-BIAS-01 · Fairness testing',
    requirement: 'Evaluate material differences in system outcomes across relevant user groups.',
    risk: 'Disparate or unfair outcomes',
    evidence: 'Group-level fairness evaluation is not yet attached',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-bias-fairness', 'policy-eu-ai-act'],
  },
  {
    clause: 'AI-SEC-10 · Dependency integrity',
    requirement: 'Assess and monitor third-party model, tool, and data dependencies.',
    risk: 'Compromised AI supply chain',
    evidence: 'Dependency inventory needs an assigned owner',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-agent-security', 'policy-iso-42001'],
  },
  {
    clause: 'AI-DATA-07 · Retention limits',
    requirement: 'Retain prompts, traces, and outputs only for an approved period and purpose.',
    risk: 'Unnecessary data retention',
    evidence: 'Retention policy approved for production traces',
    severity: 'success' as Severity,
    status: 'Approved',
    policyIds: ['policy-customer-data', 'policy-data-privacy-security'],
  },
  {
    clause: 'AI-GOV-05 · Change control',
    requirement: 'Reassess risk when a material model, prompt, or control change is released.',
    risk: 'Unassessed model or policy drift',
    evidence: 'Release review does not yet require evaluation evidence',
    severity: 'warning' as Severity,
    status: 'Needs review',
    policyIds: ['policy-responsible-ai', 'policy-iso-42001'],
  },
  {
    clause: 'AI-OPS-03 · Incident monitoring',
    requirement: 'Monitor safety incidents and provide an owned process for timely response.',
    risk: 'Delayed response to safety incidents',
    evidence: 'No incident response control mapped',
    severity: 'info' as Severity,
    status: 'Unmapped',
    policyIds: ['policy-responsible-ai', 'policy-iso-42001', 'policy-eu-ai-act'],
  },
];

export function createRecommendedGuardrailConfig(risks: Array<(typeof policyMappingRecords)[number]>): YamlConfig {
  const riskNames = risks.map(({ risk }) => risk.toLowerCase());
  const inputFlows = new Set(['self check input']);
  const outputFlows = new Set<string>();
  const actionFlows = new Set<string>();

  if (riskNames.some((risk) => /injection|harmful|policy evasion|bypass/.test(risk))) {
    inputFlows.add('user jailbreak check');
  }
  if (riskNames.some((risk) => /data|privacy|personal|credential|disclosure|fabricated|harmful|unfair|bias/.test(risk))) {
    outputFlows.add('self check output');
  }
  if (riskNames.some((risk) => /tool|autonomy|authorization|supply chain/.test(risk))) {
    actionFlows.add('tool authorization check');
  }

  const rails: YamlConfig = {
    input: { flows: Array.from(inputFlows) },
  };
  if (outputFlows.size > 0) rails.output = { flows: Array.from(outputFlows) };
  if (actionFlows.size > 0) rails.actions = { flows: Array.from(actionFlows) };

  const riskList = risks.map(({ clause, risk }) => `- ${risk} (${clause})`).join('\n');
  const prompts: YamlValue[] = [{
    task: 'self_check_input',
    content: `Check each request against the selected policy risks.\n\nSelected risks:\n${riskList}\n\nBlock requests that materially increase these risks. Return only "yes" or "no".`,
  }];
  if (outputFlows.size > 0) {
    prompts.push({
      task: 'self_check_output',
      content: `Check each response against the selected policy risks.\n\nSelected risks:\n${riskList}\n\nBlock or redact responses that materially increase these risks. Return only "yes" or "no".`,
    });
  }
  const models: YamlValue[] = [{
    type: 'self_check_input',
    engine: 'openai',
    model: 'nvidia/Nemotron-3.5-Content-Safety',
    parameters: { temperature: 0.0 },
  }];
  if (outputFlows.size > 0) {
    models.push({
      type: 'self_check_output',
      engine: 'openai',
      model: 'nvidia/Nemotron-3.5-Content-Safety',
      parameters: { temperature: 0.0 },
    });
  }

  return {
    models,
    rails,
    prompts,
  };
}
