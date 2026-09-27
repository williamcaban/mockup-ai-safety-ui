import { useState } from 'react';
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Content, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, FormGroup, FormSelect, FormSelectOption, Grid, GridItem, TextInput, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { findings } from '../data/applications';
import { evaluationRuns } from '../data/evaluations';
import { StatusLabel, SectionHeading, StatusCell } from '../components/shared';
import type { Severity } from '../types';
export function EvaluationThresholdFields({
  idPrefix,
  warning,
  critical,
  warningLabel,
  criticalLabel,
  valid,
  errorMessage,
  onWarningChange,
  onCriticalChange,
}: {
  idPrefix: string;
  warning: string;
  critical: string;
  warningLabel: string;
  criticalLabel: string;
  valid: boolean;
  errorMessage: string;
  onWarningChange: (value: string) => void;
  onCriticalChange: (value: string) => void;
}) {
  return (
    <div className="studio-evaluation-threshold-fields">
      <FormGroup label={warningLabel} fieldId={`${idPrefix}-warning`} isRequired>
        <TextInput id={`${idPrefix}-warning`} type="number" min={0} step={0.5} isRequired value={warning} onChange={(_event, value) => onWarningChange(value)} />
      </FormGroup>
      <FormGroup label={criticalLabel} fieldId={`${idPrefix}-critical`} isRequired>
        <TextInput id={`${idPrefix}-critical`} type="number" min={0} step={0.5} isRequired value={critical} onChange={(_event, value) => onCriticalChange(value)} />
      </FormGroup>
      {!valid && <Alert variant="danger" isInline title="Check threshold values">{errorMessage}</Alert>}
    </div>
  );
}
export function EvaluationsView({ queued, onQueue }: { queued: boolean; onQueue: () => void }) {
  const [setupMode, setSetupMode] = useState<'baseline' | 'traces' | 'adversarial' | null>(null);
  const [baselineDataset, setBaselineDataset] = useState('agent-safety-v6');
  const [mlflowExperiment, setMlflowExperiment] = useState('production-api-safety-traces');
  const [adversarialSuite, setAdversarialSuite] = useState('policy-mapped-red-team');
  const [baselineThresholdsOpen, setBaselineThresholdsOpen] = useState(false);
  const [traceThresholdsOpen, setTraceThresholdsOpen] = useState(false);
  const [riskThresholdsOpen, setRiskThresholdsOpen] = useState(false);
  const [baselineWarningThreshold, setBaselineWarningThreshold] = useState('5');
  const [baselineCriticalThreshold, setBaselineCriticalThreshold] = useState('10');
  const [traceWarningThreshold, setTraceWarningThreshold] = useState('5');
  const [traceCriticalThreshold, setTraceCriticalThreshold] = useState('10');
  const [riskWarningThreshold, setRiskWarningThreshold] = useState('95');
  const [riskCriticalThreshold, setRiskCriticalThreshold] = useState('85');
  const [queuedMode, setQueuedMode] = useState<string | null>(null);
  const assessThresholds = (value: number, warningText: string, criticalText: string, lowerIsCritical = false) => {
    const warning = Number(warningText);
    const critical = Number(criticalText);
    const valid = warningText.trim() !== ''
      && criticalText.trim() !== ''
      && Number.isFinite(warning)
      && Number.isFinite(critical)
      && warning >= 0
      && critical >= 0
      && (lowerIsCritical ? warning > critical : critical > warning);
    const isCritical = valid && (lowerIsCritical ? value <= critical : value >= critical);
    const isWarning = valid && (lowerIsCritical ? value <= warning : value >= warning);
    const severity: Severity = !valid ? 'info' : isCritical ? 'danger' : isWarning ? 'warning' : 'success';
    const label = !valid ? 'Thresholds invalid' : isCritical ? 'Critical' : isWarning ? 'Warning' : 'Within threshold';
    const interpretation = !valid
      ? 'Set valid thresholds to interpret this aggregate.'
      : isCritical
        ? 'Critical result: investigate before promotion.'
        : isWarning
          ? 'Warning result: review the change and affected risks.'
          : 'Within threshold: no material change indicated by this aggregate.';
    return { valid, severity, label, interpretation };
  };
  const baselineDriftStatus = assessThresholds(3.2, baselineWarningThreshold, baselineCriticalThreshold);
  const traceDriftStatus = assessThresholds(7.4, traceWarningThreshold, traceCriticalThreshold);
  const riskProfileStatus = assessThresholds(91.6, riskWarningThreshold, riskCriticalThreshold, true);
  const evaluationModeLabel = setupMode === 'baseline'
    ? 'Baseline dataset evaluation'
    : setupMode === 'traces'
      ? '24-hour MLflow trace evaluation'
      : 'Red-team / adversarial evaluation';
  return (
    <>
      <SectionHeading
        title="Evaluation evidence"
        description="Review application-level safety scores, then launch a baseline, trace, or adversarial evaluation when needed."
      />
      {queued && (
        <Alert variant="info" isInline isLiveRegion title={queuedMode ? `${queuedMode} queued in prototype` : 'Evaluation queued in prototype'}>
          Detailed run evidence belongs in EvalHub. This pane surfaces aggregate scores and interpretations; no EvalHub or MLflow connection is active in the prototype.
        </Alert>
      )}
      <Grid component="ul" hasGutter aria-label="Aggregated safety evaluation scores" className="studio-metric-grid">
        <GridItem component="li" span={12} sm={6} lg={4}>
          <Card aria-label="Agent safety baseline aggregate">
            <CardHeader>
              <CardTitle component="h2">Agent safety baseline</CardTitle>
              <StatusLabel severity={baselineDriftStatus.severity}>{baselineDriftStatus.label}</StatusLabel>
            </CardHeader>
            <CardBody>
              <div className="studio-evaluation-score">
                <span className="studio-evaluation-score-value">96.8%</span>
                <span className="studio-evaluation-score-label">aggregate pass rate</span>
              </div>
              <Content component="small" className="studio-muted">3.2% drift from approved baseline · {baselineDriftStatus.interpretation}</Content>
              <Button variant="secondary" onClick={() => setSetupMode('baseline')}>Run baseline evaluation</Button>
              <Button variant="link" aria-expanded={baselineThresholdsOpen} onClick={() => setBaselineThresholdsOpen((open) => !open)}>
                {baselineThresholdsOpen ? 'Hide thresholds' : 'Set drift thresholds'}
              </Button>
              {baselineThresholdsOpen && (
                <EvaluationThresholdFields
                  idPrefix="baseline-drift-threshold"
                  warning={baselineWarningThreshold}
                  critical={baselineCriticalThreshold}
                  warningLabel="Warning drift threshold (%)"
                  criticalLabel="Critical drift threshold (%)"
                  valid={baselineDriftStatus.valid}
                  errorMessage="Critical drift must be greater than warning drift. Both values must be zero or higher."
                  onWarningChange={setBaselineWarningThreshold}
                  onCriticalChange={setBaselineCriticalThreshold}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={4}>
          <Card aria-label="24-hour MLflow trace aggregate">
            <CardHeader>
              <CardTitle component="h2">24-hour trace behavior</CardTitle>
              <StatusLabel severity={traceDriftStatus.severity}>{traceDriftStatus.label}</StatusLabel>
            </CardHeader>
            <CardBody>
              <div className="studio-evaluation-score">
                <span className="studio-evaluation-score-value">7.4%</span>
                <span className="studio-evaluation-score-label">behavior drift</span>
              </div>
              <Content component="small" className="studio-muted">1,284 sessions from MLflow · trailing 24 hours · {traceDriftStatus.interpretation}</Content>
              <Button variant="secondary" onClick={() => setSetupMode('traces')}>Evaluate 24-hour traces</Button>
              <Button variant="link" aria-expanded={traceThresholdsOpen} onClick={() => setTraceThresholdsOpen((open) => !open)}>
                {traceThresholdsOpen ? 'Hide thresholds' : 'Set drift thresholds'}
              </Button>
              {traceThresholdsOpen && (
                <EvaluationThresholdFields
                  idPrefix="trace-drift-threshold"
                  warning={traceWarningThreshold}
                  critical={traceCriticalThreshold}
                  warningLabel="Warning drift threshold (%)"
                  criticalLabel="Critical drift threshold (%)"
                  valid={traceDriftStatus.valid}
                  errorMessage="Critical drift must be greater than warning drift. Both values must be zero or higher."
                  onWarningChange={setTraceWarningThreshold}
                  onCriticalChange={setTraceCriticalThreshold}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={4}>
          <Card aria-label="Adversarial risk profile aggregate">
            <CardHeader>
              <CardTitle component="h2">Adversarial risk profile</CardTitle>
              <StatusLabel severity={riskProfileStatus.severity}>{riskProfileStatus.label}</StatusLabel>
            </CardHeader>
            <CardBody>
              <div className="studio-evaluation-score">
                <span className="studio-evaluation-score-value">91.6%</span>
                <span className="studio-evaluation-score-label">attack resistance</span>
              </div>
              <Content component="small" className="studio-muted">3 Policy and risk items mapped · 2 high residual risks · 1 moderate · {riskProfileStatus.interpretation}</Content>
              <Button variant="secondary" onClick={() => setSetupMode('adversarial')}>Run red-team evaluation</Button>
              <Button variant="link" aria-expanded={riskThresholdsOpen} onClick={() => setRiskThresholdsOpen((open) => !open)}>
                {riskThresholdsOpen ? 'Hide thresholds' : 'Set risk thresholds'}
              </Button>
              {riskThresholdsOpen && (
                <EvaluationThresholdFields
                  idPrefix="adversarial-risk-threshold"
                  warning={riskWarningThreshold}
                  critical={riskCriticalThreshold}
                  warningLabel="Warning below this resistance (%)"
                  criticalLabel="Critical below this resistance (%)"
                  valid={riskProfileStatus.valid}
                  errorMessage="The warning resistance threshold must be greater than the critical threshold; both values must be zero or higher."
                  onWarningChange={setRiskWarningThreshold}
                  onCriticalChange={setRiskCriticalThreshold}
                />
              )}
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      <Content component="small" className="studio-muted">Drift turns yellow at its warning threshold and red at its critical threshold. Risk profile thresholds apply to attack resistance. Detailed cases and trace evidence are collected in EvalHub; this pane shows application-level aggregates.</Content>
      {setupMode && (
        <Card aria-label={`${evaluationModeLabel} setup`} className="studio-evaluation-setup">
          <CardHeader>
            <CardTitle component="h2">{evaluationModeLabel} setup</CardTitle>
            <Button variant="link" onClick={() => setSetupMode(null)}>Close setup</Button>
          </CardHeader>
          <CardBody>
            {setupMode === 'baseline' && (
              <>
                <FormGroup label="Baseline dataset" fieldId="evaluation-baseline-dataset">
                  <FormSelect id="evaluation-baseline-dataset" value={baselineDataset} onChange={(_event, value) => setBaselineDataset(value)}>
                    <FormSelectOption value="agent-safety-v6" label="Agent safety baseline · v6 · 186 examples" />
                    <FormSelectOption value="application-policy-v3" label="Application policy baseline · v3 · 128 examples" />
                  </FormSelect>
                </FormGroup>
                <Content component="small" className="studio-muted">Compares the current application, model, harness, and controls with the approved baseline package.</Content>
              </>
            )}
            {setupMode === 'traces' && (
              <>
                <FormGroup label="MLflow experiment" fieldId="evaluation-mlflow-experiment">
                  <FormSelect id="evaluation-mlflow-experiment" value={mlflowExperiment} onChange={(_event, value) => setMlflowExperiment(value)}>
                    <FormSelectOption value="production-api-safety-traces" label="production-api-safety-traces · production-api" />
                    <FormSelectOption value="agent-assistant-prod" label="agent-assistant-prod · assistant workloads" />
                    <FormSelectOption value="market-research-prod" label="market-research-prod · research assistant" />
                  </FormSelect>
                </FormGroup>
                <Content component="small" className="studio-muted">Consumes traces from the selected MLflow experiment over the trailing 24 hours to detect usage-pattern drift.</Content>
              </>
            )}
            {setupMode === 'adversarial' && (
              <>
                <FormGroup label="Adversarial scenario pack" fieldId="evaluation-adversarial-suite">
                  <FormSelect id="evaluation-adversarial-suite" value={adversarialSuite} onChange={(_event, value) => setAdversarialSuite(value)}>
                    <FormSelectOption value="policy-mapped-red-team" label="Policy-mapped red team · all identified risks" />
                    <FormSelectOption value="agent-tool-attacks" label="Agent and tool misuse · targeted risks" />
                    <FormSelectOption value="injection-and-data-exfiltration" label="Injection and data exfiltration · targeted risks" />
                  </FormSelect>
                </FormGroup>
                <Title headingLevel="h3" size="md">Policy and risk coverage</Title>
                <Content component="small" className="studio-muted">Adversarial scenarios inherit the AI risks extracted and defined in Policy and risk.</Content>
                <DescriptionList isHorizontal>
                  {findings.map((finding) => (
                    <DescriptionListGroup key={finding.clause}>
                      <DescriptionListTerm>{finding.clause}</DescriptionListTerm>
                      <DescriptionListDescription>{finding.risk}</DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              </>
            )}
            <Content component="small" className="studio-muted">Detailed evaluation results are collected in EvalHub. This prototype does not submit a live run.</Content>
            <Button
              variant="primary"
              onClick={() => {
                setQueuedMode(evaluationModeLabel);
                onQueue();
              }}
              isDisabled={setupMode === 'baseline' ? !baselineDriftStatus.valid : setupMode === 'traces' ? !traceDriftStatus.valid : !riskProfileStatus.valid}
            >
              {setupMode === 'baseline' ? 'Run baseline evaluation' : setupMode === 'traces' ? 'Evaluate 24-hour traces' : 'Run adversarial evaluation'}
            </Button>
          </CardBody>
        </Card>
      )}
      <Card aria-label="Recent evaluation runs">
        <CardHeader><CardTitle component="h2">Recent runs</CardTitle></CardHeader>
        <CardBody>
          <Table aria-label="Recent evaluation runs" variant="compact">
            <Thead><Tr><Th>Evaluation</Th><Th>Test context</Th><Th>Result</Th><Th>Run time</Th></Tr></Thead>
            <Tbody>
              {evaluationRuns.map((run) => (
                <Tr key={run.suite}>
                  <Td dataLabel="Evaluation">{run.suite}</Td>
                  <Td dataLabel="Test context">{run.context}</Td>
                  <Td dataLabel="Result"><StatusCell severity={run.severity} text={run.result} /></Td>
                  <Td dataLabel="Run time">{run.date}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
