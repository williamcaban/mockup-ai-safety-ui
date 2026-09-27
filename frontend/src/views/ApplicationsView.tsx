import { useState } from 'react';
import { Button, Card, CardBody, Content, Grid, GridItem, Label, MenuToggle, Pagination, SearchInput, Select, SelectList, SelectOption, Tooltip, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { findings } from '../data/applications';
import { EnvironmentGlyph, EnvironmentIndicator, SectionHeading, MetricCard, OutcomeMix } from '../components/shared';
import type { Severity, AppRecord } from '../types';
export function ApplicationsView({ apps, onOpen }: { apps: AppRecord[]; onOpen: (appId: string) => void }) {
  const [query, setQuery] = useState('');
  const [environment, setEnvironment] = useState('all');
  const [environmentOpen, setEnvironmentOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const totals = apps.reduce(
    (summary, app) => ({
      controls: summary.controls + app.activeControls,
      findings: summary.findings + app.openFindings,
      coverage: summary.coverage + app.evidenceCoverage,
    }),
    { controls: 0, findings: 0, coverage: 0 },
  );
  const averageCoverage = Math.round(totals.coverage / apps.length);
  const environments = Array.from(new Set(apps.map((app) => app.environment)));
  const filteredApps = apps.filter((app) => {
    const searchableText = `${app.name} ${app.kind} ${app.harness} ${app.model} ${app.owner} ${app.environment} ${app.workspace}`.toLowerCase();
    return searchableText.includes(query.trim().toLowerCase())
      && (environment === 'all' || app.environment === environment);
  });
  const visibleApps = filteredApps.slice((page - 1) * perPage, page * perPage);
  const paginationTitles = (position: string) => ({
    items: 'applications',
    paginationAriaLabel: `${position} application pagination`,
    optionsToggleAriaLabel: `${position} application rows per page`,
  });
  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, nextPage: number) => setPage(nextPage);
  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    nextPerPage: number,
    nextPage: number,
  ) => {
    setPerPage(nextPerPage);
    setPage(nextPage);
  };
  const resetFilters = () => {
    setQuery('');
    setEnvironment('all');
    setPage(1);
  };
  return (
    <>
      <Grid component="ul" hasGutter aria-label="Portfolio safety summary" className="studio-metric-grid">
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Applications" value={String(apps.length)} detail="Registered AI applications" severity="info" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Active controls" value={String(totals.controls)} detail="Controls across all applications" severity="success" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Open findings" value={String(totals.findings)} detail="Across current application reviews" severity="warning" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Average evidence coverage" value={averageCoverage + '%'} detail="Mean across registered applications" severity="info" />
        </GridItem>
      </Grid>
      <SectionHeading
        title="Your applications"
        description="Search and filter the inventory, then compare controls, findings, evidence coverage, guardrail outcomes, and evaluation freshness."
      />
      <Card aria-label="Application inventory">
        <CardBody className="studio-application-table-body">
          <Toolbar id="application-inventory-toolbar" aria-label="Application inventory filters">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search applications"
                  placeholder="Search name, harness, model, or owner"
                  value={query}
                  resultsCount={filteredApps.length}
                  resultsCountContext=" matching applications"
                  onChange={(_event, value) => {
                    setQuery(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setQuery('');
                    setPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Select
                  id="application-environment-filter"
                  className="studio-environment-select"
                  isOpen={environmentOpen}
                  selected={environment}
                  onSelect={(_event, value) => {
                    setEnvironment(String(value ?? 'all'));
                    setPage(1);
                    setEnvironmentOpen(false);
                  }}
                  onOpenChange={setEnvironmentOpen}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setEnvironmentOpen((isOpen) => !isOpen)}
                      isExpanded={environmentOpen}
                      aria-label={`Filter applications by environment: ${environment === 'all' ? 'All environments' : environment}`}
                      icon={environment === 'all' ? undefined : <EnvironmentGlyph environment={environment} />}
                    >
                      {environment === 'all' ? 'All environments' : environment}
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <SelectList>
                    <SelectOption value="all">All environments</SelectOption>
                    {environments.map((item) => (
                      <SelectOption key={item} value={item} icon={<EnvironmentGlyph environment={item} />}>
                        {item}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarItem>
              <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                <Pagination
                  variant="top"
                  isCompact
                  widgetId="application-inventory-top"
                  itemCount={filteredApps.length}
                  page={page}
                  perPage={perPage}
                  perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                  titles={paginationTitles('Top')}
                  onSetPage={onSetPage}
                  onPerPageSelect={onPerPageSelect}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table aria-label="Applications and safety posture" variant="compact" gridBreakPoint="grid-md">
            <Thead>
              <Tr>
                <Th width={25}>Application</Th>
                <Th width={10}>Active controls</Th>
                <Th width={10}>Open findings</Th>
                <Th width={15}>Evidence coverage</Th>
                <Th width={25}>Guardrail outcome · 24h</Th>
                <Th width={15}>Last evaluation</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visibleApps.map((app) => {
                const coverageSeverity: Severity = app.evidenceCoverage >= 90
                  ? 'success'
                  : app.evidenceCoverage >= 80
                    ? 'warning'
                    : 'danger';
                const findingsSeverity: Severity = app.openFindings > 2 ? 'danger' : app.openFindings > 0 ? 'warning' : 'success';
                return (
                  <Tr key={app.id}>
                    <Td dataLabel="Application">
                      <div className="studio-inventory-application">
                        <Tooltip
                          content={[
                            app.kind,
                            app.harness,
                            app.model,
                            `Owner: ${app.owner}`,
                          ].join(' · ')}
                          position="top"
                        >
                          <Button
                            variant="plain"
                            icon={<InfoCircleIcon />}
                            aria-label={`Description for ${app.name}`}
                            className="studio-inventory-info-button"
                          />
                        </Tooltip>
                        <Button
                          component="a"
                          variant="link"
                          href={`#application/${app.id}`}
                          className="studio-inventory-app-link"
                          onClick={() => onOpen(app.id)}
                        >
                          {app.name}
                        </Button>
                        <span className="studio-inventory-environment">
                          <EnvironmentIndicator environment={app.environment} />
                        </span>
                      </div>
                    </Td>
                    <Td dataLabel="Active controls"><Label color="green">{app.activeControls} active</Label></Td>
                    <Td dataLabel="Open findings">
                      <Label color={findingsSeverity === 'danger' ? 'red' : findingsSeverity === 'warning' ? 'yellow' : 'green'}>
                        {app.openFindings} open
                      </Label>
                    </Td>
                    <Td dataLabel="Evidence coverage">
                      <Label color={coverageSeverity === 'danger' ? 'red' : coverageSeverity === 'warning' ? 'yellow' : 'green'}>
                        {app.evidenceCoverage}%
                      </Label>
                    </Td>
                    <Td dataLabel="Guardrail outcome · last 24 hours"><OutcomeMix app={app} /></Td>
                    <Td dataLabel="Last evaluation">{app.lastEvaluation}</Td>
                  </Tr>
                );
              })}
              {visibleApps.length === 0 && (
                <Tr>
                  <Td colSpan={6} dataLabel="Search result">
                    <div className="studio-inventory-empty">
                      <Content component="p">No applications match these filters.</Content>
                      <Button variant="link" onClick={resetFilters}>Clear filters</Button>
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          <Pagination
            variant="bottom"
            widgetId="application-inventory-bottom"
            itemCount={filteredApps.length}
            page={page}
            perPage={perPage}
            perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
            titles={paginationTitles('Bottom')}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
          />
        </CardBody>
      </Card>
      <Content component="small" className="studio-muted studio-dashboard-footnote">
        Illustrative request outcomes for the last 24 hours. Passed, blocked, and mutated percentages sum to 100% for each application; select an application to see counts.
      </Content>
    </>
  );
}
