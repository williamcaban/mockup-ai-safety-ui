import { useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Content, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, FormSelect, FormSelectOption, Grid, GridItem, Pagination, SearchInput, Progress, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { findings } from '../data/applications';
import { guardrails } from '../data/guardrails';
import { StatusLabel, MetricCard, StatusCell, getOutcomeCounts } from '../components/shared';
import type { ViewId, AppRecord } from '../types';
export function OverviewView({ app, onNavigate }: { app: AppRecord; onNavigate: (view: ViewId) => void }) {
  const [guardrailNameQuery, setGuardrailNameQuery] = useState('');
  const [guardrailStatusFilter, setGuardrailStatusFilter] = useState('all');
  const [guardrailSortBy, setGuardrailSortBy] = useState<{ index: number; direction: 'asc' | 'desc' }>({ index: 0, direction: 'asc' });
  const [guardrailPage, setGuardrailPage] = useState(1);
  const [guardrailsPerPage, setGuardrailsPerPage] = useState(10);
  const guardrailSortKeys: Array<keyof (typeof guardrails)[number]> = ['name', 'scope', 'evidence', 'status'];
  const filteredGuardrails = useMemo(() => guardrails
    .filter((guardrail) => guardrail.name.toLowerCase().includes(guardrailNameQuery.trim().toLowerCase())
      && (guardrailStatusFilter === 'all' || guardrail.status === guardrailStatusFilter))
    .sort((left, right) => {
      const key = guardrailSortKeys[guardrailSortBy.index];
      const comparison = String(left[key]).localeCompare(String(right[key]));
      return guardrailSortBy.direction === 'asc' ? comparison : -comparison;
    }), [guardrailNameQuery, guardrailSortBy, guardrailStatusFilter]);
  const visibleGuardrails = filteredGuardrails.slice((guardrailPage - 1) * guardrailsPerPage, guardrailPage * guardrailsPerPage);
  const handleGuardrailSort = (_event: React.MouseEvent, columnIndex: number, direction: 'asc' | 'desc') => {
    setGuardrailSortBy({ index: columnIndex, direction });
    setGuardrailPage(1);
  };
  const handleGuardrailPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setGuardrailPage(page);
  const handleGuardrailsPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    page: number,
  ) => {
    setGuardrailsPerPage(perPage);
    setGuardrailPage(page);
  };
  const guardrailPaginationTitles = {
    items: 'guardrails',
    paginationAriaLabel: 'Effective guardrails pagination',
    optionsToggleAriaLabel: 'Guardrails per page',
  };
  const outcomeCounts = getOutcomeCounts(app);
  return (
    <>
      <Grid component="ul" hasGutter aria-label="Application posture summary" className="studio-metric-grid">
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Open findings" value={String(app.openFindings)} detail="2 require policy-owner review" severity="danger" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Active controls" value={String(app.activeControls)} detail="Across gateway and app scope" severity="success" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Evidence coverage" value={app.evidenceCoverage + '%'} detail="Context-matched evaluation evidence" severity="warning" />
        </GridItem>
        <GridItem component="li" span={12} sm={6} lg={3}>
          <MetricCard label="Last evaluation" value={app.lastEvaluation} detail="Agent safety baseline" severity="info" />
        </GridItem>
      </Grid>
      <Card aria-label="Guardrail request outcomes in the last 24 hours" className="studio-request-outcomes-card">
        <CardHeader><CardTitle component="h2">Guardrail request outcomes · last 24 hours</CardTitle></CardHeader>
        <CardBody>
          <Grid component="ul" hasGutter aria-label="Request outcome counts" className="studio-metric-grid">
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Passed" value={outcomeCounts.passed.toLocaleString('en-US')} detail="Requests allowed through" severity="success" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Blocked" value={outcomeCounts.blocked.toLocaleString('en-US')} detail="Requests blocked by a guardrail" severity="danger" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Mutated" value={outcomeCounts.mutated.toLocaleString('en-US')} detail="Requests modified by a guardrail" severity="warning" />
            </GridItem>
            <GridItem component="li" span={12} sm={6} lg={3}>
              <MetricCard label="Processed" value={outcomeCounts.processed.toLocaleString('en-US')} detail="Total requests observed" severity="info" />
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
      <Grid hasGutter className="studio-overview-grid">
        <GridItem span={8} lg={8} md={12}>
          <Card aria-label="Application guardrail overview">
            <CardHeader>
              <CardTitle component="h2">Effective guardrails</CardTitle>
              <Button variant="link" onClick={() => onNavigate('guardrails')}>View package</Button>
            </CardHeader>
            <CardBody>
              <Toolbar id="effective-guardrails-toolbar" aria-label="Effective guardrails filters">
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      aria-label="Search effective guardrails by control name"
                      className="studio-effective-guardrails-search"
                      placeholder="Search control names"
                      value={guardrailNameQuery}
                      resultsCount={filteredGuardrails.length}
                      resultsCountContext=" matching controls"
                      onChange={(_event, value) => {
                        setGuardrailNameQuery(value);
                        setGuardrailPage(1);
                      }}
                      onClear={() => {
                        setGuardrailNameQuery('');
                        setGuardrailPage(1);
                      }}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <FormSelect
                      aria-label="Filter effective guardrails by status"
                      className="studio-effective-guardrails-status-filter"
                      value={guardrailStatusFilter}
                      onChange={(_event, value) => {
                        setGuardrailStatusFilter(value);
                        setGuardrailPage(1);
                      }}
                    >
                      <FormSelectOption value="all" label="All statuses" />
                      <FormSelectOption value="Active" label="Active" />
                      <FormSelectOption value="Review needed" label="Review needed" />
                    </FormSelect>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              <div className="studio-effective-guardrails-scroll" role="region" aria-label="Effective guardrails table" tabIndex={0}>
                <Table aria-label="Active application guardrails" variant="compact" isStickyHeader>
                  <Thead>
                    <Tr>
                      <Th width={30} sort={{ columnIndex: 0, sortBy: guardrailSortBy, onSort: handleGuardrailSort }}>Control</Th>
                      <Th width={25} sort={{ columnIndex: 1, sortBy: guardrailSortBy, onSort: handleGuardrailSort }}>Enforcement point</Th>
                      <Th width={30} sort={{ columnIndex: 2, sortBy: guardrailSortBy, onSort: handleGuardrailSort }}>Evidence</Th>
                      <Th width={15} sort={{ columnIndex: 3, sortBy: guardrailSortBy, onSort: handleGuardrailSort }}>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {visibleGuardrails.length > 0 ? visibleGuardrails.map((item) => (
                      <Tr key={item.name}>
                        <Td dataLabel="Control">{item.name}</Td>
                        <Td dataLabel="Enforcement point">{item.scope}</Td>
                        <Td dataLabel="Evidence">{item.evidence}</Td>
                        <Td dataLabel="Status"><StatusCell severity={item.severity} text={item.status} /></Td>
                      </Tr>
                    )) : (
                      <Tr><Td colSpan={4} dataLabel="Control">No guardrails match these filters.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </div>
              <Pagination
                className="studio-effective-guardrails-pagination"
                widgetId="effective-guardrails-bottom"
                itemCount={filteredGuardrails.length}
                page={guardrailPage}
                perPage={guardrailsPerPage}
                perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                titles={guardrailPaginationTitles}
                onSetPage={handleGuardrailPage}
                onPerPageSelect={handleGuardrailsPerPage}
                variant="bottom"
                isCompact
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem span={4} lg={4} md={12}>
          <Card aria-label="Application context">
            <CardHeader><CardTitle component="h2">Application context</CardTitle></CardHeader>
            <CardBody>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Application owner</DescriptionListTerm>
                  <DescriptionListDescription>{app.owner}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Harness</DescriptionListTerm>
                  <DescriptionListDescription>{app.harness}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Model and version</DescriptionListTerm>
                  <DescriptionListDescription>{app.model} · {app.version}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Environment</DescriptionListTerm>
                  <DescriptionListDescription>{app.environment}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Context manifest</DescriptionListTerm>
                  <DescriptionListDescription>Verified · 2026-09-25 09:30</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Trace source</DescriptionListTerm>
                  <DescriptionListDescription>OpenTelemetry / OpenInference</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      <Grid hasGutter className="studio-overview-grid">
        <GridItem span={6} md={12}>
          <Card aria-label="Policy-to-control coverage">
            <CardHeader><CardTitle component="h2">Policy-to-control coverage</CardTitle></CardHeader>
            <CardBody>
              <Content component="p" className="studio-muted">
                Source clauses are linked to risk mappings, controls, and evaluation evidence. Unresolved items remain visible for review.
              </Content>
              <Progress title="Requirements with mapped controls and current evidence" value={app.evidenceCoverage} measureLocation="outside" />
              <div className="studio-inline-stat">
                <StatusLabel severity="success">18 evidenced</StatusLabel>
                <StatusLabel severity="warning">3 need review</StatusLabel>
                <StatusLabel severity="info">2 unmapped</StatusLabel>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem span={6} md={12}>
          <Card aria-label="Next action">
            <CardHeader><CardTitle component="h2">Recommended next action</CardTitle></CardHeader>
            <CardBody>
              <div className="studio-next-action">
                <ExclamationTriangleIcon />
                <div>
                  <strong>Review tool authorization and injection findings</strong>
                  <Content component="p" className="studio-muted">
                    Two failed scenarios and three trace-linked probes are waiting for an owner decision.
                  </Content>
                </div>
              </div>
              <Button variant="primary" onClick={() => onNavigate('policy')}>Review findings</Button>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </>
  );
}
