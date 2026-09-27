import { useMemo, useState } from 'react';
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Checkbox, Content, FormSelect, FormSelectOption, Grid, GridItem, Label, Pagination, SearchInput, Select, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { enforcementPointLabel, guardrails, catalogDefinitions } from '../data/guardrails';
import { StatusLabel, SectionHeading, MetricCard, StatusCell } from '../components/shared';
import type { AppRecord, MonitoringSignalStatus, MonitoringSignal } from '../types';
export function MonitoringView({
  app,
  selectedGuardrailIds,
  onApplySelection,
}: {
  app: AppRecord;
  selectedGuardrailIds: string[];
  onApplySelection: (ids: string[]) => void;
}) {
  const [draftGuardrailIds, setDraftGuardrailIds] = useState(selectedGuardrailIds);
  const [selectionSaved, setSelectionSaved] = useState(false);
  const [guardrailNameQuery, setGuardrailNameQuery] = useState('');
  const [guardrailCoverageFilter, setGuardrailCoverageFilter] = useState<'all' | 'none' | 'low' | 'medium' | 'high'>('all');
  const [guardrailEnforcementFilter, setGuardrailEnforcementFilter] = useState('all');
  const [guardrailPackagePage, setGuardrailPackagePage] = useState(1);
  const [guardrailsPerPage, setGuardrailsPerPage] = useState(10);
  const [signalStatusFilter, setSignalStatusFilter] = useState<MonitoringSignalStatus | 'all'>('all');
  const [signalQuery, setSignalQuery] = useState('');
  const [signalSortBy, setSignalSortBy] = useState<{ index: number; direction: 'asc' | 'desc' }>({ index: 3, direction: 'desc' });
  const [signalPage, setSignalPage] = useState(1);
  const [signalsPerPage, setSignalsPerPage] = useState(20);
  const hasSelectionChanges = draftGuardrailIds.length !== selectedGuardrailIds.length
    || draftGuardrailIds.some((id) => !selectedGuardrailIds.includes(id));
  const selectedDefinitions = catalogDefinitions.filter((definition) => definition.lifecycle === 'Published' && draftGuardrailIds.includes(definition.id));
  const publishedDefinitions = catalogDefinitions.filter((definition) => definition.lifecycle === 'Published');
  const enforcementPointOptions = Array.from(new Set(publishedDefinitions.flatMap((definition) => definition.rails.map((rail) => rail.category))))
    .sort((left, right) => enforcementPointLabel(left).localeCompare(enforcementPointLabel(right)));
  const publishedGuardrails = publishedDefinitions.filter((definition) => {
    const matchesName = definition.name.toLowerCase().includes(guardrailNameQuery.trim().toLowerCase());
    const matchesEnforcementPoint = guardrailEnforcementFilter === 'all'
      || definition.rails.some((rail) => rail.category === guardrailEnforcementFilter);
    const matchesCoverage = guardrailCoverageFilter === 'all'
      || (guardrailCoverageFilter === 'none' && definition.evaluationCoverage === 0)
      || (guardrailCoverageFilter === 'low' && definition.evaluationCoverage > 0 && definition.evaluationCoverage < 70)
      || (guardrailCoverageFilter === 'medium' && definition.evaluationCoverage >= 70 && definition.evaluationCoverage < 90)
      || (guardrailCoverageFilter === 'high' && definition.evaluationCoverage >= 90);
    return matchesName && matchesEnforcementPoint && matchesCoverage;
  });
  const visiblePublishedGuardrails = publishedGuardrails.slice((guardrailPackagePage - 1) * guardrailsPerPage, guardrailPackagePage * guardrailsPerPage);
  const guardrailPackagePaginationTitles = {
    items: 'published guardrails',
    paginationAriaLabel: 'Application guardrail package pagination',
    optionsToggleAriaLabel: 'Application guardrails per page',
  };
  const selectedEnforcementPoints = Array.from(new Set(selectedDefinitions.flatMap((definition) => definition.rails.map((rail) => rail.category))));
  const signalEvents = useMemo<MonitoringSignal[]>(() => {
    const signalTemplates: Omit<MonitoringSignal, 'id' | 'occurredAt' | 'timeLabel' | 'source'>[] = [
      { signal: 'Unregistered tool request blocked', risk: 'Tool authorization', status: 'Blocked', severity: 'success' },
      { signal: 'PII output check missing context', risk: 'Sensitive data disclosure', status: 'Needs review', severity: 'warning' },
      { signal: 'Injection probe matched input rail', risk: 'Indirect prompt injection', status: 'Blocked', severity: 'success' },
      { signal: 'Request passed content safety check', risk: 'Harmful content', status: 'Allowed', severity: 'success' },
      { signal: 'Sensitive data masked before response', risk: 'Personal data exposure', status: 'Redacted', severity: 'info' },
      { signal: 'Off-topic request flagged for review', risk: 'Policy boundary', status: 'Warned', severity: 'warning' },
    ];
    return Array.from({ length: 240 }, (_, index) => {
      const template = signalTemplates[index % signalTemplates.length];
      const ageMinutes = 3 + index * 6;
      const timeLabel = ageMinutes < 60
        ? `${ageMinutes} min ago`
        : ageMinutes < 1_440
          ? `${Math.floor(ageMinutes / 60)} hr ago`
          : `${Math.floor(ageMinutes / 1_440)} days ago`;
      const traceId = (0x7f2a + index * 7919).toString(16).slice(-4);
      return {
        ...template,
        id: `${app.id}-signal-${index + 1}`,
        source: index % 3 === 0 ? `OTel span · trace ${traceId}` : 'Guardrail decision span',
        occurredAt: -ageMinutes,
        timeLabel,
      };
    });
  }, [app.id]);
  const signalColumnKeys: Array<keyof MonitoringSignal> = ['signal', 'risk', 'source', 'occurredAt', 'status'];
  const sortedSignals = useMemo(() => signalEvents
    .filter((signal) => (signalStatusFilter === 'all' || signal.status === signalStatusFilter)
      && signal.signal.toLowerCase().includes(signalQuery.trim().toLowerCase()))
    .sort((left, right) => {
      const key = signalColumnKeys[signalSortBy.index];
      const comparison = key === 'occurredAt'
        ? left.occurredAt - right.occurredAt
        : String(left[key]).localeCompare(String(right[key]));
      return signalSortBy.direction === 'asc' ? comparison : -comparison;
    }), [signalEvents, signalQuery, signalSortBy, signalStatusFilter]);
  const visibleSignals = sortedSignals.slice((signalPage - 1) * signalsPerPage, signalPage * signalsPerPage);
  const signalPaginationTitles = {
    items: 'signals',
    paginationAriaLabel: 'Recent signals pagination',
    optionsToggleAriaLabel: 'Signals per page',
  };
  const handleSignalSort = (_event: React.MouseEvent, columnIndex: number, direction: 'asc' | 'desc') => {
    setSignalSortBy({ index: columnIndex, direction });
    setSignalPage(1);
  };
  const handleSignalPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setSignalPage(page);
  const handleSignalsPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    page: number,
  ) => {
    setSignalsPerPage(perPage);
    setSignalPage(page);
  };
  const handleGuardrailPackagePage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setGuardrailPackagePage(page);
  const handleGuardrailsPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    page: number,
  ) => {
    setGuardrailsPerPage(perPage);
    setGuardrailPackagePage(page);
  };
  const toggleGuardrail = (guardrailId: string, isChecked: boolean) => {
    setDraftGuardrailIds((current) => isChecked
      ? [...current, guardrailId]
      : current.filter((id) => id !== guardrailId));
    setSelectionSaved(false);
  };
  return (
    <>
      <SectionHeading
        title="Application safety signals"
        description="Review enforcement activity, trace coverage, and evidence freshness for this application."
      />
      <Grid component="ul" hasGutter aria-label="Application monitoring signals" className="studio-metric-grid">
        <GridItem component="li" span={12} sm={6} lg={4}>
          <MetricCard label="Traced sessions" value="1,284" detail="Last 24 hours · 82% coverage" severity="info" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={4}>
          <MetricCard label="Guardrail actions" value="27" detail="18 block · 6 redact · 3 warn" severity="warning" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={4}>
          <MetricCard label="Evidence freshness" value="12 min" detail="OpenTelemetry trace source" severity="success" />
        </GridItem>
      </Grid>
      <Grid hasGutter className="studio-overview-grid">
        <GridItem span={12} lg={12} md={12}>
          <Card aria-label="Application safety events">
            <CardHeader><CardTitle component="h2">Recent signals · {app.name}</CardTitle></CardHeader>
            <CardBody>
              <div className="studio-recent-signals-toolbar">
                <Content component="small" className="studio-muted" aria-live="polite">
                  Showing {sortedSignals.length === 0 ? 0 : (signalPage - 1) * signalsPerPage + 1}–{Math.min(signalPage * signalsPerPage, sortedSignals.length)} of {sortedSignals.length} signals
                </Content>
                <SearchInput
                  aria-label="Search signals by name"
                  className="studio-recent-signals-search"
                  placeholder="Search signal names"
                  value={signalQuery}
                  resultsCount={sortedSignals.length}
                  resultsCountContext=" matching signals"
                  onChange={(_event, value) => {
                    setSignalQuery(value);
                    setSignalPage(1);
                  }}
                  onClear={() => {
                    setSignalQuery('');
                    setSignalPage(1);
                  }}
                />
                <FormSelect
                  aria-label="Filter recent signals by status"
                  className="studio-recent-signals-filter"
                  value={signalStatusFilter}
                  onChange={(_event, value) => {
                    setSignalStatusFilter(value as MonitoringSignalStatus | 'all');
                    setSignalPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All statuses" />
                  <FormSelectOption value="Blocked" label="Blocked" />
                  <FormSelectOption value="Needs review" label="Needs review" />
                  <FormSelectOption value="Allowed" label="Allowed" />
                  <FormSelectOption value="Redacted" label="Redacted" />
                  <FormSelectOption value="Warned" label="Warned" />
                </FormSelect>
              </div>
              <div className="studio-recent-signals-scroll" role="region" aria-label="Recent application safety signals table" tabIndex={0}>
                <Table aria-label="Recent application safety signals" variant="compact" isStickyHeader>
                  <Thead>
                    <Tr>
                      <Th width={30} sort={{ columnIndex: 0, sortBy: signalSortBy, onSort: handleSignalSort }}>Signal</Th>
                      <Th width={20} sort={{ columnIndex: 1, sortBy: signalSortBy, onSort: handleSignalSort }}>Risk or control</Th>
                      <Th width={15} sort={{ columnIndex: 2, sortBy: signalSortBy, onSort: handleSignalSort }}>Source</Th>
                      <Th width={15} sort={{ columnIndex: 3, sortBy: signalSortBy, onSort: handleSignalSort }}>Time</Th>
                      <Th width={20} sort={{ columnIndex: 4, sortBy: signalSortBy, onSort: handleSignalSort }}>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {visibleSignals.length > 0 ? visibleSignals.map((signal) => (
                      <Tr key={signal.id}>
                        <Td dataLabel="Signal">{signal.signal}</Td>
                        <Td dataLabel="Risk or control">{signal.risk}</Td>
                        <Td dataLabel="Source">{signal.source}</Td>
                        <Td dataLabel="Time">{signal.timeLabel}</Td>
                        <Td dataLabel="Status"><StatusCell severity={signal.severity} text={signal.status} /></Td>
                      </Tr>
                    )) : (
                      <Tr><Td colSpan={5} dataLabel="Status">No signals match these filters.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </div>
              <Pagination
                className="studio-recent-signals-pagination"
                widgetId="recent-signals-bottom"
                itemCount={sortedSignals.length}
                page={signalPage}
                perPage={signalsPerPage}
                perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                titles={signalPaginationTitles}
                onSetPage={handleSignalPage}
                onPerPageSelect={handleSignalsPerPage}
                variant="bottom"
                isCompact
              />
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      <SectionHeading
        title={`Guardrails for ${app.name}`}
        description="Choose the published guardrails this application should enforce."
      />
      <Card aria-label={`Guardrail selection for ${app.name}`} className="studio-application-guardrails-card">
        <CardHeader>
          <CardTitle component="h2">Application guardrail package</CardTitle>
          <div className="studio-package-header-actions">
            <StatusLabel severity="info">{selectedDefinitions.length} selected</StatusLabel>
            <Button
              variant="primary"
              onClick={() => {
                onApplySelection(draftGuardrailIds);
                setSelectionSaved(true);
              }}
              isDisabled={!hasSelectionChanges}
            >
              Apply selection
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Content component="p" className="studio-muted">
            Select from published definitions to include in {app.name}'s guardrail package. Search by name to find a specific guardrail.
          </Content>
          {selectionSaved && (
            <Alert variant="success" isInline title="Application selection saved">
              The mock package now includes {selectedDefinitions.length} guardrails for {app.name}. No live configuration has been deployed.
            </Alert>
          )}
          <Grid component="ul" hasGutter aria-label="Selected package summary" className="studio-metric-grid">
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Selected guardrails" value={String(selectedDefinitions.length)} detail="Published definitions in this package" severity="info" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Enforcement points" value={String(selectedEnforcementPoints.length)} detail={selectedEnforcementPoints.map(enforcementPointLabel).join(' · ') || 'None selected'} severity="success" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Evaluation evidence" value={`${selectedDefinitions.filter((definition) => definition.evaluationCoverage > 0).length}/${selectedDefinitions.length}`} detail="Selected definitions with coverage data" severity="warning" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Package state" value={hasSelectionChanges ? 'Unsaved' : 'Current'} detail={hasSelectionChanges ? 'Apply selection to save this draft' : 'Selection matches the saved mock package'} severity={hasSelectionChanges ? 'warning' : 'success'} />
            </GridItem>
          </Grid>
          <Toolbar id="application-guardrail-search-toolbar" aria-label="Application guardrail package search">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search published guardrails by name"
                  className="studio-application-guardrail-search"
                  placeholder="Search guardrail names"
                  value={guardrailNameQuery}
                  resultsCount={publishedGuardrails.length}
                  resultsCountContext=" matching published guardrails"
                  onChange={(_event, value) => {
                    setGuardrailNameQuery(value);
                    setGuardrailPackagePage(1);
                  }}
                  onClear={() => {
                    setGuardrailNameQuery('');
                    setGuardrailPackagePage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter guardrails by evaluation coverage"
                  className="studio-application-guardrail-filter"
                  value={guardrailCoverageFilter}
                  onChange={(_event, value) => {
                    setGuardrailCoverageFilter(value as typeof guardrailCoverageFilter);
                    setGuardrailPackagePage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All coverage levels" />
                  <FormSelectOption value="none" label="No evaluation coverage" />
                  <FormSelectOption value="low" label="Low · 1–69%" />
                  <FormSelectOption value="medium" label="Moderate · 70–89%" />
                  <FormSelectOption value="high" label="High · 90–100%" />
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter guardrails by enforcement point"
                  className="studio-application-guardrail-filter"
                  value={guardrailEnforcementFilter}
                  onChange={(_event, value) => {
                    setGuardrailEnforcementFilter(value);
                    setGuardrailPackagePage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All enforcement points" />
                  {enforcementPointOptions.map((point) => (
                    <FormSelectOption key={point} value={point} label={enforcementPointLabel(point)} />
                  ))}
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                <Pagination
                  variant="top"
                  isCompact
                  widgetId="application-guardrail-package-top"
                  itemCount={publishedGuardrails.length}
                  page={guardrailPackagePage}
                  perPage={guardrailsPerPage}
                  perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                  titles={guardrailPackagePaginationTitles}
                  onSetPage={handleGuardrailPackagePage}
                  onPerPageSelect={handleGuardrailsPerPage}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table aria-label={`Available guardrails for ${app.name}`} variant="compact" gridBreakPoint="grid-md">
            <Thead>
              <Tr>
                <Th width={10}>Apply</Th>
                <Th width={40}>Guardrail</Th>
                <Th width={30}>Enforcement points</Th>
                <Th width={20}>Evaluation coverage</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visiblePublishedGuardrails.length > 0 ? visiblePublishedGuardrails.map((definition) => {
                const isSelected = draftGuardrailIds.includes(definition.id);
                const coverageColor = definition.evaluationCoverage >= 90 ? 'green' : definition.evaluationCoverage >= 70 ? 'yellow' : 'red';
                const enforcementPoints = Array.from(new Set(definition.rails.map((rail) => rail.category)));
                return (
                  <Tr key={definition.id}>
                    <Td dataLabel="Apply">
                      <Checkbox
                        id={`apply-${app.id}-${definition.id}`}
                        aria-label={`${isSelected ? 'Remove' : 'Apply'} ${definition.name} ${isSelected ? 'from' : 'to'} ${app.name}`}
                        isChecked={isSelected}
                        onChange={(_event, checked) => toggleGuardrail(definition.id, checked)}
                      />
                    </Td>
                    <Td dataLabel="Guardrail">
                      <strong>{definition.name}</strong>
                      <Content component="small" className="studio-catalog-description">{definition.description}</Content>
                    </Td>
                    <Td dataLabel="Enforcement points">
                      {enforcementPoints.length ? enforcementPoints.map((point) => <Label key={point} className="studio-derived-point">{enforcementPointLabel(point)}</Label>) : <span className="studio-muted">No rail flows</span>}
                    </Td>
                    <Td dataLabel="Evaluation coverage"><Label color={coverageColor}>{definition.evaluationCoverage}%</Label></Td>
                  </Tr>
                );
              }) : (
                <Tr><Td colSpan={4} dataLabel="Guardrail">No published guardrails match these filters.</Td></Tr>
              )}
            </Tbody>
          </Table>
          <Pagination
            className="studio-application-guardrail-pagination"
            variant="bottom"
            isCompact
            widgetId="application-guardrail-package-bottom"
            itemCount={publishedGuardrails.length}
            page={guardrailPackagePage}
            perPage={guardrailsPerPage}
            perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
            titles={guardrailPackagePaginationTitles}
            onSetPage={handleGuardrailPackagePage}
            onPerPageSelect={handleGuardrailsPerPage}
          />
        </CardBody>
      </Card>
    </>
  );
}
