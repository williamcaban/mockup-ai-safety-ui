export type ViewId = 'applications' | 'overview' | 'policy' | 'guardrails' | 'evaluations' | 'monitoring';
export type Severity = 'danger' | 'warning' | 'success' | 'info';

export type AppRecord = {
  id: string;
  name: string;
  environment: string;
  workspace: string;
  kind: string;
  harness: string;
  model: string;
  version: string;
  owner: string;
  openFindings: number;
  activeControls: number;
  evidenceCoverage: number;
  processedRequests: number;
  blockedRequests: number;
  mutatedRequests: number;
  lastEvaluation: string;
  posture: string;
};

export type PolicyDocumentStatus = 'Draft' | 'Active' | 'Retired';

export type PolicyDocument = {
  id: string;
  title: string;
  version: string;
  source: string;
  sourceReference?: string;
  assertionsConfigYaml?: string;
  mappingProvenance?: {
    mapper: string;
    riskCatalogue: string;
  };
  scope: string;
  status: PolicyDocumentStatus;
  createdAt: string;
};

export type PolicyIntakeSource = 'file' | 'url';



export type MonitoringSignalStatus = 'Blocked' | 'Needs review' | 'Allowed' | 'Redacted' | 'Warned';
export type MonitoringSignal = {
  id: string;
  signal: string;
  risk: string;
  source: string;
  occurredAt: number;
  timeLabel: string;
  status: MonitoringSignalStatus;
  severity: Severity;
};

export type CatalogDefinition = {
  id: string;
  name: string;
  description: string;
  models: GuardrailModelConfig[];
  rails: GuardrailRailConfig[];
  prompts: GuardrailPromptConfig[];
  lifecycle: 'Published' | 'Draft' | 'Retired';
  version: string;
  evaluationCoverage: number;
  config?: YamlConfig;
  configYaml?: string;
};

export type YamlValue = string | number | boolean | null | YamlValue[] | YamlConfig;
export type YamlConfig = { [key: string]: YamlValue };
export type GuardrailModelConfig = { type: string; engine: string; model: string };
export type GuardrailRailCategory = 'input' | 'retrieval' | 'dialog' | 'actions' | 'tool_input' | 'tool_output' | 'execution' | 'output';
export type GuardrailRailConfig = { category: GuardrailRailCategory; flow: string };
export type GuardrailPromptConfig = { task: string; content: string };
export type GuardrailEditorDraft = {
  name: string;
  description: string;
  config: YamlConfig;
};
export type GuardrailEditorMode = 'upload' | 'yaml';
export type GuardrailCreationStage = 'landing' | 'risks' | 'generating' | 'generated' | 'editor';
export type GuardrailCreationPath = 'auto' | 'yaml' | 'upload' | null;
