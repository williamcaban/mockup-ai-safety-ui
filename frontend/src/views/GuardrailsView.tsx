import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, Checkbox, Content, FormGroup, FormSelect, FormSelectOption, FileUpload, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, SearchInput, Spinner, Page, Select, TextArea, TextInput, Title, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { CodeBranchIcon, FileAltIcon, ShieldAltIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { stringify as stringifyYaml } from 'yaml';
import { defaultGuardrailYaml, emptyGuardrailDraft, nextDraftVersion, definitionToYamlConfig, configToCatalogSummary, enforcementPointLabel, catalogDefinitions } from '../data/guardrails';
import { policyMappingRecords, createRecommendedGuardrailConfig } from '../data/policies';
import { StatusLabel, isValidYamlValue, parseGuardrailConfigYaml, formatGuardrailConfigYaml, SectionHeading } from '../components/shared';
import type { ViewId, Severity, CatalogDefinition, YamlConfig, GuardrailEditorDraft, GuardrailEditorMode, GuardrailCreationStage, GuardrailCreationPath } from '../types';
export function GuardrailsView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const [definitions, setDefinitions] = useState(catalogDefinitions);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogEnforcementFilter, setCatalogEnforcementFilter] = useState('all');
  const [catalogLifecycleFilter, setCatalogLifecycleFilter] = useState<'all' | 'Published' | 'Draft' | 'Retired'>('all');
  const [catalogCoverageFilter, setCatalogCoverageFilter] = useState<'all' | 'none' | 'low' | 'medium' | 'high'>('all');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPerPage, setCatalogPerPage] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [creationStage, setCreationStage] = useState<GuardrailCreationStage>('landing');
  const [creationPath, setCreationPath] = useState<GuardrailCreationPath>(null);
  const [selectedRiskClauses, setSelectedRiskClauses] = useState<string[]>([]);
  const [riskSearchQuery, setRiskSearchQuery] = useState('');
  const [riskPage, setRiskPage] = useState(1);
  const [riskPerPage, setRiskPerPage] = useState(10);
  const [editingDefinitionId, setEditingDefinitionId] = useState<string | null>(null);
  const [editingLifecycle, setEditingLifecycle] = useState<CatalogDefinition['lifecycle']>('Draft');
  const [editingLifecycleAtOpen, setEditingLifecycleAtOpen] = useState<CatalogDefinition['lifecycle']>('Draft');
  const [confirmDeleteGuardrail, setConfirmDeleteGuardrail] = useState(false);
  const [draft, setDraft] = useState<GuardrailEditorDraft>(emptyGuardrailDraft());
  const [savedGuardrail, setSavedGuardrail] = useState('');
  const [deletedGuardrailName, setDeletedGuardrailName] = useState('');
  const [evaluationRequest, setEvaluationRequest] = useState('');
  const [yamlUploadStatus, setYamlUploadStatus] = useState('');
  const [yamlUploadError, setYamlUploadError] = useState('');
  const [yamlUploadFile, setYamlUploadFile] = useState<File | null>(null);
  const [isReadingYaml, setIsReadingYaml] = useState(false);
  const [editorMode, setEditorMode] = useState<GuardrailEditorMode>('yaml');
  const [yamlEditorText, setYamlEditorText] = useState('');
  const [appliedYamlText, setAppliedYamlText] = useState('');
  const [yamlEditorError, setYamlEditorError] = useState('');
  const [yamlEditorStatus, setYamlEditorStatus] = useState('');
  useEffect(() => {
    if (creationStage !== 'generating') return undefined;
    const generationTimer = window.setTimeout(() => setCreationStage('generated'), 2400);
    return () => window.clearTimeout(generationTimer);
  }, [creationStage]);
  const enforcementPointOptions = Array.from(new Set(definitions.flatMap((definition) => definition.rails.map((rail) => rail.category))))
    .sort((left, right) => enforcementPointLabel(left).localeCompare(enforcementPointLabel(right)));
  const filteredDefinitions = definitions.filter((definition) => {
    const searchableText = `${definition.name} ${definition.description} ${definition.rails.map((rail) => `${rail.category} ${rail.flow}`).join(' ')} ${definition.models.map((model) => `${model.type} ${model.engine} ${model.model}`).join(' ')} ${definition.prompts.map((prompt) => `${prompt.task} ${prompt.content}`).join(' ')} ${definition.lifecycle}`
      .toLowerCase();
    const matchesSearch = searchableText.includes(catalogQuery.trim().toLowerCase());
    const matchesEnforcementPoint = catalogEnforcementFilter === 'all'
      || definition.rails.some((rail) => rail.category === catalogEnforcementFilter);
    const matchesLifecycle = catalogLifecycleFilter === 'all' || definition.lifecycle === catalogLifecycleFilter;
    const matchesCoverage = catalogCoverageFilter === 'all'
      || (catalogCoverageFilter === 'none' && definition.evaluationCoverage === 0)
      || (catalogCoverageFilter === 'low' && definition.evaluationCoverage > 0 && definition.evaluationCoverage < 70)
      || (catalogCoverageFilter === 'medium' && definition.evaluationCoverage >= 70 && definition.evaluationCoverage < 90)
      || (catalogCoverageFilter === 'high' && definition.evaluationCoverage >= 90);
    return matchesSearch && matchesEnforcementPoint && matchesLifecycle && matchesCoverage;
  });
  const visibleDefinitions = filteredDefinitions.slice((catalogPage - 1) * catalogPerPage, catalogPage * catalogPerPage);
  const catalogPaginationTitles = {
    items: 'guardrail definitions',
    paginationAriaLabel: 'Guardrail catalog pagination',
    optionsToggleAriaLabel: 'Guardrail catalog rows per page',
  };
  const onSetCatalogPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, nextPage: number) => setCatalogPage(nextPage);
  const onSetCatalogPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    nextPerPage: number,
    nextPage: number,
  ) => {
    setCatalogPerPage(nextPerPage);
    setCatalogPage(nextPage);
  };
  const clearCatalogFilters = () => {
    setCatalogQuery('');
    setCatalogEnforcementFilter('all');
    setCatalogLifecycleFilter('all');
    setCatalogCoverageFilter('all');
    setCatalogPage(1);
  };
  const openCreateEditor = () => {
    const initialDraft = emptyGuardrailDraft();
    const initialYaml = defaultGuardrailYaml;
    setEditingDefinitionId(null);
    setEditingLifecycle('Draft');
    setEditingLifecycleAtOpen('Draft');
    setConfirmDeleteGuardrail(false);
    setCreationStage('landing');
    setCreationPath(null);
    setSelectedRiskClauses([]);
    setRiskSearchQuery('');
    setRiskPage(1);
    setDraft(initialDraft);
    setDeletedGuardrailName('');
    setYamlUploadStatus('');
    setYamlUploadError('');
    setYamlUploadFile(null);
    setIsReadingYaml(false);
    setEditorMode('yaml');
    setYamlEditorText(initialYaml);
    setAppliedYamlText(initialYaml);
    setYamlEditorError('');
    setYamlEditorStatus('');
    setCreateOpen(true);
  };
  const openEditEditor = (definition: CatalogDefinition) => {
    const config = definitionToYamlConfig(definition);
    const initialYaml = definition.configYaml ?? stringifyYaml(config, { lineWidth: 0 });
    setEditingDefinitionId(definition.id);
    setEditingLifecycle(definition.lifecycle);
    setEditingLifecycleAtOpen(definition.lifecycle);
    setConfirmDeleteGuardrail(false);
    setDeletedGuardrailName('');
    setDraft({
      name: definition.name,
      description: definition.description,
      config,
    });
    setCreationStage('editor');
    setCreationPath('yaml');
    setSelectedRiskClauses([]);
    setYamlUploadStatus('');
    setYamlUploadError('');
    setYamlUploadFile(null);
    setIsReadingYaml(false);
    setEditorMode('yaml');
    setYamlEditorText(initialYaml);
    setAppliedYamlText(initialYaml);
    setYamlEditorError('');
    setYamlEditorStatus('');
    setCreateOpen(true);
  };
  const chooseCreationPath = (path: Exclude<GuardrailCreationPath, null>) => {
    setCreationPath(path);
    if (path === 'auto') {
      setCreationStage('risks');
      return;
    }
    setEditorMode(path);
    setCreationStage('editor');
  };
  const startGuardrailGeneration = () => {
    const selectedRisks = policyMappingRecords.filter((item) => selectedRiskClauses.includes(item.clause));
    if (selectedRisks.length === 0) return;
    const config = createRecommendedGuardrailConfig(selectedRisks);
    const initialYaml = stringifyYaml(config, { lineWidth: 0 });
    const generatedName = selectedRisks.length === 1
      ? `${selectedRisks[0].risk} guardrail`
      : `Policy risk guardrails (${selectedRisks.length} risks)`;
    setDraft({
      name: generatedName,
      description: `Recommended controls generated for ${selectedRisks.map(({ risk }) => risk).join(', ')}.`,
      config,
    });
    setYamlEditorText(initialYaml);
    setAppliedYamlText(initialYaml);
    setYamlEditorError('');
    setYamlEditorStatus('');
    setEditorMode('yaml');
    setCreationStage('generating');
  };
  const openYamlEditor = () => {
    setEditorMode('yaml');
    setYamlEditorError('');
    setYamlEditorStatus('');
    setCreationStage('editor');
  };
  const toggleSelectedRisk = (clause: string, checked: boolean) => {
    setSelectedRiskClauses((current) => checked
      ? [...current, clause]
      : current.filter((selectedClause) => selectedClause !== clause));
  };
  const backFromEditor = () => {
    setCreationStage(creationPath === 'auto' ? 'generated' : 'landing');
  };
  const deleteRetiredGuardrail = () => {
    if (!editingDefinitionId || editingLifecycleAtOpen !== 'Retired') return;
    const sourceDefinition = definitions.find((definition) => definition.id === editingDefinitionId);
    if (!sourceDefinition || sourceDefinition.lifecycle !== 'Retired') return;
    setDefinitions((current) => current.filter((definition) => definition.id !== editingDefinitionId));
    setCatalogPage(1);
    setSavedGuardrail('');
    setDeletedGuardrailName(sourceDefinition.name);
    setCreateOpen(false);
    setEditingDefinitionId(null);
    setEditingLifecycle('Draft');
    setEditingLifecycleAtOpen('Draft');
    setConfirmDeleteGuardrail(false);
  };
  const handleYamlUpload = async (file: File) => {
    setYamlUploadFile(file);
    setIsReadingYaml(true);
    try {
      const source = await file.text();
      const parsed = parseGuardrailConfigYaml(source);
      setDraft((current) => ({
        ...current,
        name: current.name || file.name.replace(/\.ya?ml$/i, '').replace(/[-_]+/g, ' '),
        config: parsed,
      }));
      setYamlEditorText(source);
      setAppliedYamlText(source);
      setYamlEditorError('');
      setYamlEditorStatus('');
      setYamlUploadStatus(`${file.name} loaded. Review the imported configuration, then save the draft.`);
      setYamlUploadError('');
    } catch (error) {
      setYamlUploadError(error instanceof Error ? error.message : 'The YAML file could not be parsed.');
      setYamlUploadStatus('');
    } finally {
      setIsReadingYaml(false);
    }
  };
  const parseInlineYaml = () => {
    try {
      const parsed = parseGuardrailConfigYaml(yamlEditorText);
      setDraft((current) => ({ ...current, config: parsed }));
      setAppliedYamlText(yamlEditorText);
      setYamlEditorError('');
      setYamlEditorStatus('YAML validated.');
      return parsed;
    } catch (error) {
      setYamlEditorError(error instanceof Error ? error.message : 'The YAML could not be parsed.');
      return null;
    }
  };
  const formatInlineYaml = () => {
    try {
      const formatted = formatGuardrailConfigYaml(yamlEditorText);
      setYamlEditorText(formatted);
      setYamlEditorError('');
      setYamlEditorStatus('YAML formatted. Apply it to update the draft. Comments are preserved.');
    } catch (error) {
      setYamlEditorError(error instanceof Error ? error.message : 'The YAML could not be parsed.');
      setYamlEditorStatus('');
    }
  };
  const resetInlineYaml = () => {
    setYamlEditorText(appliedYamlText);
    setYamlEditorError('');
    setYamlEditorStatus('Editor restored from the current draft configuration.');
  };
  const handleYamlEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const editor = event.currentTarget;
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const { selectionStart, selectionEnd, value } = editor;
    let updatedText: string;
    let nextSelectionStart: number;
    let nextSelectionEnd: number;
    if (selectionStart === selectionEnd) {
      updatedText = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      nextSelectionStart = selectionStart + 2;
      nextSelectionEnd = nextSelectionStart;
    } else {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const selectedLines = value.slice(lineStart, selectionEnd);
      const lineCount = selectedLines.split('\n').length;
      updatedText = `${value.slice(0, lineStart)}  ${selectedLines.replace(/\n/g, '\n  ')}${value.slice(selectionEnd)}`;
      nextSelectionStart = lineStart + 2;
      nextSelectionEnd = selectionEnd + (lineCount * 2);
    }
    setYamlEditorText(updatedText);
    setYamlEditorError('');
    setYamlEditorStatus('');
    requestAnimationFrame(() => editor.setSelectionRange(nextSelectionStart, nextSelectionEnd));
  };
  const saveGuardrail = () => {
    const name = draft.name.trim();
    if (!name || !isValidYamlValue(draft.config)) return;
    const config = editorMode === 'yaml' ? parseInlineYaml() : draft.config;
    if (!config) return;
    const sourceDefinition = definitions.find((definition) => definition.id === editingDefinitionId);
    const summary = configToCatalogSummary(config);
    const definition: CatalogDefinition = {
      id: editingDefinitionId ?? `draft-${Date.now()}`,
      name,
      description: draft.description.trim() || 'No description provided.',
      ...summary,
      lifecycle: editingDefinitionId ? editingLifecycle : 'Draft',
      version: sourceDefinition ? nextDraftVersion(sourceDefinition.version) : 'v0.1',
      evaluationCoverage: 0,
      config: JSON.parse(JSON.stringify(config)) as YamlConfig,
      configYaml: editorMode === 'yaml' ? yamlEditorText : appliedYamlText,
    };
    setDefinitions((current) => {
      if (editingDefinitionId) {
        return current.map((item) => item.id === editingDefinitionId ? definition : item);
      }
      return [definition, ...current];
    });
    setCatalogQuery('');
    setCatalogPage(1);
    setSavedGuardrail(name);
    setCreateOpen(false);
    setCreationStage('landing');
    setCreationPath(null);
    setSelectedRiskClauses([]);
    setDraft(emptyGuardrailDraft());
    setEditingDefinitionId(null);
    setYamlUploadStatus('');
    setYamlUploadError('');
    setYamlUploadFile(null);
    setIsReadingYaml(false);
    setYamlEditorError('');
    setYamlEditorStatus('');
  };
  const closeGuardrailEditor = () => {
    setCreateOpen(false);
    setCreationStage('landing');
    setCreationPath(null);
    setSelectedRiskClauses([]);
    setRiskSearchQuery('');
    setRiskPage(1);
  };
  const draftIsValid = Boolean(draft.name.trim()) && isValidYamlValue(draft.config);
  let yamlEditorProblem = yamlEditorError;
  try {
    parseGuardrailConfigYaml(yamlEditorText);
  } catch (error) {
    yamlEditorProblem = error instanceof Error ? error.message : 'The YAML could not be parsed.';
  }
  const yamlEditorIsValid = !yamlEditorProblem;
  const yamlEditorLineCount = yamlEditorText.split(/\r\n|\r|\n/).length;
  const selectedRiskRecords = policyMappingRecords.filter((item) => selectedRiskClauses.includes(item.clause));
  const filteredPolicyRisks = policyMappingRecords.filter((item) =>
    `${item.risk} ${item.clause} ${item.requirement}`.toLowerCase().includes(riskSearchQuery.trim().toLowerCase()),
  );
  const visiblePolicyRisks = filteredPolicyRisks.slice((riskPage - 1) * riskPerPage, riskPage * riskPerPage);
  const policyRiskPageCount = Math.ceil(filteredPolicyRisks.length / riskPerPage);
  const policyRiskPageLabel = policyRiskPageCount > 0 ? `Page ${riskPage} of ${policyRiskPageCount}` : '0 pages';
  const policyRiskPaginationTitles = {
    items: 'policy risks',
    paginationAriaLabel: 'Policy risk selection pagination',
    optionsToggleAriaLabel: 'Policy risks per page',
  };
  const onSetRiskPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, nextPage: number) => setRiskPage(nextPage);
  const onSetRiskPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    nextPerPage: number,
    nextPage: number,
  ) => {
    setRiskPerPage(nextPerPage);
    setRiskPage(nextPage);
  };
  const canSaveGuardrail = draftIsValid && (editorMode === 'yaml'
    ? yamlEditorIsValid
    : Boolean(yamlUploadFile && yamlUploadStatus && !yamlUploadError && !isReadingYaml));
  const currentEditingDefinition = definitions.find((definition) => definition.id === editingDefinitionId);
  const canDeleteRetiredGuardrail = editingLifecycleAtOpen === 'Retired'
    && currentEditingDefinition?.lifecycle === 'Retired'
    && editingLifecycle === 'Retired';
  const createModalTitle = editingDefinitionId
    ? 'Edit guardrail definition'
    : creationStage === 'landing'
      ? 'Add guardrail'
      : creationStage === 'risks'
        ? 'Auto-generate guardrail'
        : creationStage === 'generating'
          ? 'Generating guardrail'
          : creationStage === 'generated'
            ? 'Review generated guardrail'
            : editorMode === 'upload'
              ? 'Import config.yml'
              : creationPath === 'auto'
                ? 'View/edit generated guardrail'
                : 'Inline YAML edit';
  const createModalDescription = editingDefinitionId
    ? 'Edit the config.yml inline. Saving a published version creates a new draft version.'
    : creationStage === 'landing'
      ? 'Choose a way to create a guardrail definition.'
      : creationStage === 'risks'
        ? 'Choose the risks from Policy mapping review that this guardrail should mitigate.'
        : creationStage === 'generating'
          ? 'Building a recommended NeMo Guardrails configuration from the selected policy risks.'
          : creationStage === 'generated'
            ? 'Review the generated recommendation, then save it as a draft or open the YAML editor.'
            : editorMode === 'upload'
              ? 'Upload or drop a config.yml file to create a guardrail draft.'
              : 'Edit the complete config.yml directly. YAML is checked as you type.';
  return (
    <>
      <div className="studio-catalog-heading">
        <SectionHeading title="Guardrails catalog" description="Search and compare guardrail definitions and evaluation coverage. Edit configuration and lifecycle from each definition." />
        <div className="studio-catalog-actions">
          <Button variant="primary" onClick={() => openCreateEditor()}>Add guardrail</Button>
        </div>
      </div>
      {savedGuardrail && (
        <Alert variant="success" isInline title="Guardrail saved" className="studio-prototype-alert">
          {savedGuardrail} is saved locally. No evaluation evidence is attached yet.
        </Alert>
      )}
      {deletedGuardrailName && (
        <Alert variant="info" isInline title="Retired guardrail deleted" className="studio-prototype-alert">
          {deletedGuardrailName} was removed from the local catalog.
        </Alert>
      )}
      {evaluationRequest && (
        <Alert variant="info" isInline title="Evaluation request recorded" className="studio-prototype-alert">
          A request to evaluate {evaluationRequest} was recorded locally. The prototype is not connected to a live evaluation service.
        </Alert>
      )}
      <Card aria-label="Guardrails catalog">
        <CardBody className="studio-guardrail-catalog-body">
          <Toolbar id="guardrail-catalog-toolbar" aria-label="Guardrail catalog controls">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search guardrail definitions"
                  className="studio-catalog-search"
                  placeholder="Search definitions"
                  value={catalogQuery}
                  resultsCount={filteredDefinitions.length}
                  resultsCountContext=" matching guardrails"
                  onChange={(_event, value) => {
                    setCatalogQuery(value);
                    setCatalogPage(1);
                    setSavedGuardrail('');
                  }}
                  onClear={() => {
                    setCatalogQuery('');
                    setCatalogPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter guardrails by enforcement point"
                  className="studio-catalog-filter"
                  value={catalogEnforcementFilter}
                  onChange={(_event, value) => {
                    setCatalogEnforcementFilter(value);
                    setCatalogPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All enforcement points" />
                  {enforcementPointOptions.map((point) => (
                    <FormSelectOption key={point} value={point} label={enforcementPointLabel(point)} />
                  ))}
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter guardrails by lifecycle"
                  className="studio-catalog-filter"
                  value={catalogLifecycleFilter}
                  onChange={(_event, value) => {
                    setCatalogLifecycleFilter(value as typeof catalogLifecycleFilter);
                    setCatalogPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All lifecycle states" />
                  <FormSelectOption value="Published" label="Published" />
                  <FormSelectOption value="Draft" label="Draft" />
                  <FormSelectOption value="Retired" label="Retired" />
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter guardrails by evaluation coverage"
                  className="studio-catalog-filter"
                  value={catalogCoverageFilter}
                  onChange={(_event, value) => {
                    setCatalogCoverageFilter(value as typeof catalogCoverageFilter);
                    setCatalogPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All coverage levels" />
                  <FormSelectOption value="none" label="No coverage" />
                  <FormSelectOption value="low" label="Low · 1–69%" />
                  <FormSelectOption value="medium" label="Moderate · 70–89%" />
                  <FormSelectOption value="high" label="High · 90–100%" />
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                <Pagination
                  variant="top"
                  isCompact
                  widgetId="guardrail-catalog-top"
                  itemCount={filteredDefinitions.length}
                  page={catalogPage}
                  perPage={catalogPerPage}
                  perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                  titles={catalogPaginationTitles}
                  onSetPage={onSetCatalogPage}
                  onPerPageSelect={onSetCatalogPerPage}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table aria-label="Guardrail definitions with column filters and evaluation coverage" variant="compact" gridBreakPoint="grid-md">
            <Thead>
              <Tr>
                <Th width={30}>Definition</Th>
                <Th width={20}>Enforcement points</Th>
                <Th width={15}>Lifecycle</Th>
                <Th width={15}>Evaluation coverage</Th>
                <Th width={20}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visibleDefinitions.map((definition) => {
                const coverageSeverity: Severity = definition.evaluationCoverage >= 90
                  ? 'success'
                  : definition.evaluationCoverage >= 70
                    ? 'warning'
                    : 'danger';
                const coverageColor = coverageSeverity === 'success' ? 'green' : coverageSeverity === 'warning' ? 'yellow' : 'red';
                const enforcementPoints = Array.from(new Set(definition.rails.map((rail) => rail.category)));
                return (
                  <Tr key={definition.id}>
                    <Td dataLabel="Definition">
                      <strong>{definition.name}</strong>
                      <Content component="small" className="studio-catalog-description">{definition.description}</Content>
                    </Td>
                    <Td dataLabel="Enforcement points">
                      {enforcementPoints.length ? enforcementPoints.map((point) => <Label key={point} className="studio-derived-point">{enforcementPointLabel(point)}</Label>) : <span className="studio-muted">No rail flows</span>}
                    </Td>
                    <Td dataLabel="Lifecycle">
                      <StatusLabel severity={definition.lifecycle === 'Published' ? 'success' : definition.lifecycle === 'Draft' ? 'warning' : 'info'}>
                        {definition.lifecycle} · {definition.version}
                      </StatusLabel>
                    </Td>
                    <Td dataLabel="Evaluation coverage">
                      <Label color={coverageColor}>{definition.evaluationCoverage}%</Label>
                    </Td>
                    <Td dataLabel="Actions">
                      <div className="studio-catalog-row-actions">
                        <Button variant="link" onClick={() => openEditEditor(definition)}>Edit</Button>
                        <Button
                          variant="link"
                          onClick={() => {
                            setEvaluationRequest(definition.name);
                            setSavedGuardrail('');
                          }}
                        >
                          Run evaluation
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
              {visibleDefinitions.length === 0 && (
                <Tr>
                  <Td colSpan={5} dataLabel="Search result">
                    <div className="studio-inventory-empty">
                      <Content component="p">No guardrail definitions match these filters.</Content>
                      <Button variant="link" onClick={clearCatalogFilters}>Clear all filters</Button>
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          <Pagination
            className="studio-catalog-pagination"
            variant="bottom"
            isCompact
            widgetId="guardrail-catalog-bottom"
            itemCount={filteredDefinitions.length}
            page={catalogPage}
            perPage={catalogPerPage}
            perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
            titles={catalogPaginationTitles}
            onSetPage={onSetCatalogPage}
            onPerPageSelect={onSetCatalogPerPage}
          />
        </CardBody>
      </Card>
      <Modal isOpen={createOpen} onClose={closeGuardrailEditor} variant="large" aria-labelledby="create-guardrail-title">
        <ModalHeader
          title={createModalTitle}
          labelId="create-guardrail-title"
          description={createModalDescription}
          descriptorId="guardrail-editor-description"
        />
        <ModalBody>
          {!editingDefinitionId && creationStage === 'landing' && (
            <div className="studio-guardrail-create-landing">
              <Content component="p">Choose how you want to create the guardrail configuration.</Content>
              <div className="studio-guardrail-create-tiles" role="group" aria-label="Guardrail creation methods">
                <button type="button" className="studio-guardrail-create-tile" onClick={() => chooseCreationPath('auto')}>
                  <ShieldAltIcon className="studio-guardrail-create-tile-icon" aria-hidden="true" />
                  <strong>Auto Generate</strong>
                  <span>Select policy risks and generate a recommended guardrail configuration.</span>
                </button>
                <button type="button" className="studio-guardrail-create-tile" onClick={() => chooseCreationPath('yaml')}>
                  <CodeBranchIcon className="studio-guardrail-create-tile-icon" aria-hidden="true" />
                  <strong>Inline YAML Edit</strong>
                  <span>Write or refine the complete config.yml in the editor.</span>
                </button>
                <button type="button" className="studio-guardrail-create-tile" onClick={() => chooseCreationPath('upload')}>
                  <FileAltIcon className="studio-guardrail-create-tile-icon" aria-hidden="true" />
                  <strong>Import config.yml</strong>
                  <span>Upload or drop an existing YAML configuration file.</span>
                </button>
              </div>
            </div>
          )}
          {!editingDefinitionId && creationStage === 'risks' && (
            <section className="studio-auto-generate-risks" aria-labelledby="guardrail-risk-selection-heading">
              <div className="studio-config-section-heading">
                <div>
                  <Title headingLevel="h3" size="md" id="guardrail-risk-selection-heading">Select policy risks to mitigate</Title>
                  <Content component="small">These risks come from the Policy mapping review. The generated YAML will use them to recommend enforcement points and prompts.</Content>
                </div>
                <Label color={selectedRiskRecords.length ? 'blue' : 'grey'}>{selectedRiskRecords.length} selected</Label>
              </div>
              <Toolbar id="guardrail-risk-selection-toolbar" aria-label="Search and paginate policy risks">
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      aria-label="Search policy risks by name"
                      className="studio-auto-generate-risk-search"
                      placeholder="Search risk name or clause"
                      value={riskSearchQuery}
                      resultsCount={filteredPolicyRisks.length}
                      resultsCountContext=" matching policy risks"
                      onChange={(_event, value) => {
                        setRiskSearchQuery(value);
                        setRiskPage(1);
                      }}
                      onClear={() => {
                        setRiskSearchQuery('');
                        setRiskPage(1);
                      }}
                    />
                  </ToolbarItem>
                  <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                    <Pagination
                      variant="top"
                      isCompact
                      widgetId="guardrail-risk-selection-top"
                      itemCount={filteredPolicyRisks.length}
                      page={riskPage}
                      perPage={riskPerPage}
                      perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }]}
                      titles={policyRiskPaginationTitles}
                      onSetPage={onSetRiskPage}
                      onPerPageSelect={onSetRiskPerPage}
                    />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              <div className="studio-auto-generate-risk-list" role="group" aria-label="Policy mapping review risks">
                {visiblePolicyRisks.map((item) => {
                  const itemIndex = policyMappingRecords.indexOf(item);
                  return (
                    <div className="studio-auto-generate-risk-option" key={item.clause}>
                      <Checkbox
                        id={`generate-risk-${itemIndex}`}
                        aria-label={`${item.risk}, ${item.clause}, ${item.status}`}
                        isChecked={selectedRiskClauses.includes(item.clause)}
                        onChange={(_event, checked) => toggleSelectedRisk(item.clause, checked)}
                      />
                      <label htmlFor={`generate-risk-${itemIndex}`}>
                        <strong>{item.risk}</strong>
                        <small>{item.clause} · {item.status}</small>
                        <small className="studio-muted">{item.requirement}</small>
                      </label>
                    </div>
                  );
                })}
                {visiblePolicyRisks.length === 0 && (
                  <div className="studio-auto-generate-risk-empty">No policy risks match this search.</div>
                )}
              </div>
              <div className="studio-auto-generate-pagination">
                <span className="studio-pagination-page-indicator" aria-live="polite">{policyRiskPageLabel}</span>
                <Pagination
                  variant="bottom"
                  isCompact
                  widgetId="guardrail-risk-selection-bottom"
                  itemCount={filteredPolicyRisks.length}
                  page={riskPage}
                  perPage={riskPerPage}
                  perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }]}
                  titles={policyRiskPaginationTitles}
                  onSetPage={onSetRiskPage}
                  onPerPageSelect={onSetRiskPerPage}
                />
              </div>
            </section>
          )}
          {!editingDefinitionId && creationStage === 'generating' && (
            <div className="studio-guardrail-generation-status" role="status" aria-live="polite">
              <Spinner size="lg" aria-label="Generating recommended guardrail configuration" />
              <div>
                <Title headingLevel="h3" size="md">Generating a recommended guardrail</Title>
                <Content component="p">Reviewing {selectedRiskRecords.length} selected policy {selectedRiskRecords.length === 1 ? 'risk' : 'risks'}, choosing enforcement points, and drafting the NeMo Guardrails YAML.</Content>
                <Content component="small" className="studio-muted">This prototype simulates the generation step; exact progress is not available. This may take a moment.</Content>
              </div>
            </div>
          )}
          {!editingDefinitionId && creationStage === 'generated' && (
            <section className="studio-generated-guardrail" aria-labelledby="generated-guardrail-heading">
              <Alert variant="success" isInline title="Recommended configuration generated">
                Review the recommendation before using it. Generated controls are saved as a draft and have no evaluation evidence yet.
              </Alert>
              <div className="studio-generated-guardrail-summary">
                <Title headingLevel="h3" size="md" id="generated-guardrail-heading">{draft.name}</Title>
                <Content component="p">{draft.description}</Content>
                <Content component="small" className="studio-muted">
                  {configToCatalogSummary(draft.config).rails.length} enforcement flows · {configToCatalogSummary(draft.config).prompts.length} prompts · {selectedRiskRecords.length} mapped risks
                </Content>
              </div>
              <div className="studio-generated-risk-tags" aria-label="Risks addressed by this recommendation">
                {selectedRiskRecords.map((item) => <Label key={item.clause}>{item.risk}</Label>)}
              </div>
            </section>
          )}
          {(editingDefinitionId || creationStage === 'editor') && (
            <>
              <Alert variant="info" isInline title="NeMo Guardrails configuration">
                The YAML uses top-level sections such as <code>models</code>, <code>rails</code>, and <code>prompts</code>, with nested values and engine parameters.
              </Alert>
              <section className="studio-config-editor-section" aria-labelledby="guardrail-basics-heading">
                <Title headingLevel="h3" size="md" id="guardrail-basics-heading">Definition details</Title>
                <FormGroup label="Guardrail name" fieldId="guardrail-name" isRequired>
                  <TextInput isRequired id="guardrail-name" value={draft.name} onChange={(_event, value) => setDraft((current) => ({ ...current, name: value }))} placeholder="For example, PII output filter" />
                </FormGroup>
                <FormGroup label="Description" fieldId="guardrail-description">
                  <TextArea id="guardrail-description" value={draft.description} onChange={(_event, value) => setDraft((current) => ({ ...current, description: value }))} placeholder="Describe the risk or behavior this guardrail addresses." resizeOrientation="vertical" />
                </FormGroup>
                {editingDefinitionId && (
                  <div className="studio-guardrail-lifecycle-editor">
                    <FormGroup label="Lifecycle state" fieldId="guardrail-lifecycle-state">
                      <FormSelect
                        id="guardrail-lifecycle-state"
                        aria-label="Guardrail lifecycle state"
                        value={editingLifecycle}
                        onChange={(_event, value) => {
                          setEditingLifecycle(value as CatalogDefinition['lifecycle']);
                          setConfirmDeleteGuardrail(false);
                        }}
                      >
                        <FormSelectOption value="Draft" label="Draft" />
                        <FormSelectOption value="Published" label="Published" />
                        <FormSelectOption value="Retired" label="Retired" />
                      </FormSelect>
                      <Content component="small" className="studio-muted">
                        Lifecycle changes are saved together with the guardrail configuration.
                      </Content>
                    </FormGroup>
                  </div>
                )}
                {confirmDeleteGuardrail && (
                  <Alert variant="warning" isInline title="Delete retired guardrail?">
                    <Content component="p">{currentEditingDefinition?.name} will be removed from the catalog. This action cannot be undone.</Content>
                    <div className="studio-guardrail-delete-confirm-actions">
                      <Button variant="danger" onClick={deleteRetiredGuardrail} isDisabled={!canDeleteRetiredGuardrail}>Confirm delete</Button>
                      <Button variant="link" onClick={() => setConfirmDeleteGuardrail(false)}>Keep guardrail</Button>
                    </div>
                  </Alert>
                )}
              </section>
              {editorMode === 'yaml' ? (
                <section className="studio-config-editor-section" aria-labelledby="guardrail-yaml-heading">
                  <Title headingLevel="h3" size="md" id="guardrail-yaml-heading">Guardrail configuration</Title>
                  <Content component="small">Edit the full NeMo Guardrails config.yml directly. YAML is checked as you type and saved with the guardrail.</Content>
                  <div className="studio-yaml-editor-toolbar">
                    <div className="studio-yaml-editor-status" aria-live="polite">
                      <Label color={yamlEditorIsValid ? 'green' : 'red'}>{yamlEditorIsValid ? 'Valid YAML' : 'Needs correction'}</Label>
                      <Content component="small">{yamlEditorLineCount} lines · Tab indents</Content>
                    </div>
                    <div className="studio-yaml-editor-actions">
                      <Button variant="link" onClick={resetInlineYaml}>Reset from draft</Button>
                      <Button variant="secondary" onClick={formatInlineYaml} isDisabled={!yamlEditorIsValid}>Format YAML</Button>
                    </div>
                  </div>
                  <FormGroup label="config.yml" fieldId="guardrail-inline-yaml">
                    <TextArea
                      id="guardrail-inline-yaml"
                      className="studio-yaml-inline-editor"
                      value={yamlEditorText}
                      rows={24}
                      wrap="off"
                      spellCheck={false}
                      validated={yamlEditorIsValid ? 'success' : 'error'}
                      onChange={(_event, text) => { setYamlEditorText(text); setYamlEditorError(''); setYamlEditorStatus(''); }}
                      onKeyDown={handleYamlEditorKeyDown}
                      resizeOrientation="vertical"
                    />
                  </FormGroup>
                  <Content component="small" className="studio-muted">Live checks cover YAML syntax and a mapping at the document root; full NeMo runtime schema validation is not connected in this prototype.</Content>
                  {yamlEditorProblem && <Alert variant="danger" isInline title="YAML needs correction">{yamlEditorProblem}</Alert>}
                  {yamlEditorStatus && <Alert variant="success" isInline title="YAML editor updated">{yamlEditorStatus}</Alert>}
                </section>
              ) : (
                <section className="studio-config-editor-section" aria-label="Upload or replace guardrail configuration">
                  <Title headingLevel="h3" size="md">Guardrail configuration</Title>
                  <Alert variant="info" isInline title={editingDefinitionId ? 'Replace this definition’s config.yml' : 'Import a config.yml'}>
                    Uploading replaces the entire configuration tree in this draft. The guardrail name and description stay as entered.
                  </Alert>
                  <FormGroup label="YAML configuration file" fieldId="guardrail-config-upload">
                    <FileUpload
                      id="guardrail-config-upload"
                      value={yamlUploadFile ?? undefined}
                      filename={yamlUploadFile?.name ?? ''}
                      browseButtonText="Choose YAML file"
                      isLoading={isReadingYaml}
                      validated={yamlUploadError ? 'error' : yamlUploadStatus ? 'success' : 'default'}
                      dropzoneProps={{ accept: { 'text/yaml': ['.yml', '.yaml'], 'application/yaml': ['.yml', '.yaml'] } }}
                      onFileInputChange={(_event, file) => { void handleYamlUpload(file); }}
                      onClearClick={() => { setYamlUploadFile(null); setYamlUploadStatus(''); setYamlUploadError(''); }}
                    />
                    <Content component="small" className="studio-muted">Choose or drop a .yml or .yaml file.</Content>
                  </FormGroup>
                  {yamlUploadStatus && <Alert variant="success" isInline title="Configuration imported">{yamlUploadStatus}</Alert>}
                  {yamlUploadError && <Alert variant="danger" isInline title="Could not import configuration">{yamlUploadError}</Alert>}
                </section>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {(editingDefinitionId || creationStage === 'editor') && (
            <>
              <Button variant="primary" onClick={saveGuardrail} isDisabled={!canSaveGuardrail}>Save</Button>
              {editingDefinitionId && canDeleteRetiredGuardrail && (
                <Button variant="danger" onClick={() => setConfirmDeleteGuardrail(true)}>Delete guardrail</Button>
              )}
              {editorMode === 'upload' && yamlUploadStatus && !yamlUploadError && (
                <Button variant="secondary" onClick={openYamlEditor}>View/edit YAML</Button>
              )}
              {!editingDefinitionId && <Button variant="link" onClick={backFromEditor}>Back to options</Button>}
              <Button variant="link" onClick={closeGuardrailEditor}>Cancel</Button>
            </>
          )}
          {!editingDefinitionId && creationStage === 'landing' && (
            <Button variant="link" onClick={closeGuardrailEditor}>Cancel</Button>
          )}
          {!editingDefinitionId && creationStage === 'risks' && (
            <>
              <Button variant="primary" onClick={startGuardrailGeneration} isDisabled={selectedRiskRecords.length === 0}>Generate guardrail</Button>
              <Button variant="link" onClick={() => setCreationStage('landing')}>Back to options</Button>
              <Button variant="link" onClick={closeGuardrailEditor}>Cancel</Button>
            </>
          )}
          {!editingDefinitionId && creationStage === 'generating' && (
            <Button variant="link" onClick={() => setCreationStage('risks')}>Cancel generation</Button>
          )}
          {!editingDefinitionId && creationStage === 'generated' && (
            <>
              <Button variant="primary" onClick={saveGuardrail}>Save</Button>
              <Button variant="secondary" onClick={openYamlEditor}>View/edit YAML</Button>
              <Button variant="link" onClick={closeGuardrailEditor}>Cancel</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
}
