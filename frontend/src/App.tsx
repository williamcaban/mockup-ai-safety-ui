import { useEffect, useState } from 'react';
import { Alert, Breadcrumb, BreadcrumbItem, Button, Content, FormSelect, FormSelectOption, Masthead, MastheadBrand, MastheadContent, MastheadLogo, MastheadMain, MastheadToggle, MenuToggle, Nav, NavGroup, NavItem, Page, PageSection, PageSidebar, PageSidebarBody, PageToggleButton, Select, SelectGroup, SelectList, SelectOption, Title, Tooltip, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { BellIcon, ChartLineIcon, CheckCircleIcon, CubeIcon, FileAltIcon, ShieldAltIcon } from '@patternfly/react-icons';
import { applications, allWorkspacesScope, workspaceScopeId, workspaceNames, isApplicationInScope } from './data/applications';
import { initialPolicyDocuments, policyMappingRecords } from './data/policies';
import { guardrails } from './data/guardrails';
import { viewTitles, getInitialApplicationId, getInitialView } from './data/navigation';
import { StatusLabel } from './components/shared';
import type { ViewId, PolicyDocument } from './types';
import { PolicyIntakeDialog } from './components/PolicyIntakeDialog';
import { ApplicationsView } from './views/ApplicationsView';
import { OverviewView } from './views/OverviewView';
import { PolicyView } from './views/PolicyView';
import { GuardrailsView } from './views/GuardrailsView';
import { EvaluationsView } from './views/EvaluationsView';
import { MonitoringView } from './views/MonitoringView';
export default function App() {
  const [view, setView] = useState<ViewId>(getInitialView);
  const [appId, setAppId] = useState<string>(getInitialApplicationId);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([allWorkspacesScope]);
  const [workspaceSelectOpen, setWorkspaceSelectOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [createdPolicyName, setCreatedPolicyName] = useState('');
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>(initialPolicyDocuments);
  const [policyMappingPolicyIds, setPolicyMappingPolicyIds] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(policyMappingRecords.map((item) => [item.clause, item.policyIds])),
  );
  const [evaluationQueued, setEvaluationQueued] = useState(false);
  const [applicationGuardrailIdsByApp, setApplicationGuardrailIdsByApp] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(applications.map((app) => [app.id, [
      'prompt-injection-input-rail',
      'content-safety-input-output',
      'tool-authorization-check',
    ]])),
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const scopedApplications = applications.filter((app) => isApplicationInScope(app, selectedWorkspaceIds));
  const activeApp = applications.find((app) => app.id === appId) ?? applications[0];
  const isApplicationSafetyView = view === 'overview' || view === 'evaluations' || view === 'monitoring';
  const isPolicyControlView = view === 'policy' || view === 'guardrails';
  const labelForWorkspace = (scopeId: string) => scopeId.slice('workspace:'.length);
  const workspaceScopeLabel = selectedWorkspaceIds.includes(allWorkspacesScope)
    ? 'All projects/workspaces'
    : selectedWorkspaceIds.length === 1
      ? labelForWorkspace(selectedWorkspaceIds[0])
      : `${selectedWorkspaceIds.length} projects/workspaces selected`;
  const definitionWorkspaceDescription = selectedWorkspaceIds.includes(allWorkspacesScope)
    ? 'all projects/workspaces'
    : selectedWorkspaceIds.map(labelForWorkspace).join(', ');
  const handleWorkspaceScopeSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const selectedValue = String(value ?? '');
    let nextScopeIds: string[];
    if (selectedValue === allWorkspacesScope) {
      nextScopeIds = [allWorkspacesScope];
    } else {
      const currentScopes = selectedWorkspaceIds.filter((scopeId) => scopeId !== allWorkspacesScope);
      const toggledScopes = currentScopes.includes(selectedValue)
        ? currentScopes.filter((scopeId) => scopeId !== selectedValue)
        : [...currentScopes, selectedValue];
      nextScopeIds = toggledScopes.length > 0 ? toggledScopes : [allWorkspacesScope];
    }
    setSelectedWorkspaceIds(nextScopeIds);
    if (isApplicationSafetyView && !applications.some((app) => app.id === appId && isApplicationInScope(app, nextScopeIds))) {
      const nextApplication = applications.find((app) => isApplicationInScope(app, nextScopeIds));
      if (nextApplication) {
        setAppId(nextApplication.id);
        window.history.replaceState(null, '', `#application/${nextApplication.id}`);
      }
    }
  };
  useEffect(() => {
    const syncApplicationRoute = () => {
      const match = window.location.hash.match(/^#application\/([^/]+)$/);
      const requestedId = match?.[1];
      const requestedApp = applications.find((app) => app.id === requestedId);
      if (requestedApp) {
        setAppId(requestedApp.id);
        setView('overview');
      } else if (!window.location.hash || window.location.hash === '#applications') {
        setView('applications');
      }
    };
    window.addEventListener('hashchange', syncApplicationRoute);
    return () => window.removeEventListener('hashchange', syncApplicationRoute);
  }, []);
  const navigate = (nextView: ViewId) => {
    setView(nextView);
    if (nextView === 'applications' && window.location.hash !== '#applications') {
      window.location.hash = '#applications';
    }
  };
  const openApplication = (nextAppId: string) => {
    setAppId(nextAppId);
    setView('overview');
  };
  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            isHamburgerButton
            aria-label="Toggle application navigation"
            isSidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen((open) => !open)}
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo component="a" href="#applications" onClick={() => navigate('applications')} className="studio-brand">
            <span className="studio-brand-mark" aria-hidden="true"><ShieldAltIcon /></span>
            <span>AI Safety Studio</span>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="studio-header-toolbar">
          <ToolbarContent>
            <ToolbarItem>
              <Select
                id="project-workspace-scope-select"
                role="menu"
                aria-label="Select projects/workspaces"
                isOpen={workspaceSelectOpen}
                isScrollable
                maxMenuHeight="24rem"
                selected={selectedWorkspaceIds}
                onSelect={handleWorkspaceScopeSelect}
                onOpenChange={setWorkspaceSelectOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    className="studio-workspace-select-toggle"
                    onClick={() => setWorkspaceSelectOpen((isOpen) => !isOpen)}
                    isExpanded={workspaceSelectOpen}
                    aria-label={`Project/workspace scope: ${workspaceScopeLabel}`}
                  >
                    {workspaceScopeLabel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectGroup label="Project/workspace">
                    <SelectOption
                      hasCheckbox
                      value={allWorkspacesScope}
                      isSelected={selectedWorkspaceIds.includes(allWorkspacesScope)}
                    >
                      All projects/workspaces
                    </SelectOption>
                    {workspaceNames.map((workspace) => {
                      const scopeId = workspaceScopeId(workspace);
                      return (
                        <SelectOption key={scopeId} hasCheckbox value={scopeId} isSelected={selectedWorkspaceIds.includes(scopeId)}>
                          {workspace}
                        </SelectOption>
                      );
                    })}
                  </SelectGroup>
                </SelectList>
              </Select>
            </ToolbarItem>
            <ToolbarItem>
              <Tooltip content={notificationsOpen ? 'Hide notifications' : 'View notifications'}>
                <Button
                  variant="plain"
                  aria-label={notificationsOpen ? 'Hide notifications' : 'Notifications'}
                  aria-expanded={notificationsOpen}
                  aria-controls="studio-notifications"
                  onClick={() => setNotificationsOpen((open) => !open)}
                >
                  <BellIcon />
                </Button>
              </Tooltip>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );
  const sidebar = (
    <PageSidebar isSidebarOpen={sidebarOpen}>
      <PageSidebarBody usePageInsets>
        <div className="studio-sidebar-context">
          <Content component="small">
            {isApplicationSafetyView ? 'CURRENT APPLICATION' : isPolicyControlView ? 'DEFINITION SCOPE' : 'PROJECT / WORKSPACE SCOPE'}
          </Content>
          {isApplicationSafetyView ? (
            <>
              <strong>{activeApp.name}</strong>
              <span>Project/workspace: {activeApp.workspace}</span>
            </>
          ) : (
            <>
              <strong>{view === 'applications' ? workspaceScopeLabel : `System-wide + ${workspaceScopeLabel}`}</strong>
              <span>{scopedApplications.length} applications in scope</span>
            </>
          )}
        </div>
        <Nav aria-label="AI Safety Studio navigation" onSelect={(_event, selected) => navigate(selected.itemId as ViewId)}>
          <NavGroup title="WORKSPACE">
            <NavItem itemId="applications" to="#applications" preventDefault isActive={view === 'applications'} icon={<CubeIcon />}>
              Applications
            </NavItem>
          </NavGroup>
          <NavGroup title="APPLICATION SAFETY">
            <NavItem itemId="overview" to="#overview" preventDefault isActive={view === 'overview'} icon={<CubeIcon />}>
              Safety profile
            </NavItem>
            <NavItem itemId="evaluations" to="#evaluations" preventDefault isActive={view === 'evaluations'} icon={<CheckCircleIcon />}>
              Safety evaluations
            </NavItem>
            <NavItem itemId="monitoring" to="#monitoring" preventDefault isActive={view === 'monitoring'} icon={<ChartLineIcon />}>
              Safety management
            </NavItem>
          </NavGroup>
          <NavGroup title="POLICY TO CONTROL">
            <NavItem itemId="policy" to="#policy" preventDefault isActive={view === 'policy'} icon={<FileAltIcon />}>
              Policy and risk
            </NavItem>
            <NavItem itemId="guardrails" to="#guardrails" preventDefault isActive={view === 'guardrails'} icon={<ShieldAltIcon />}>
              Guardrails
            </NavItem>
          </NavGroup>
        </Nav>
        <div className="studio-sidebar-footer">
          <StatusLabel severity="info">Prototype workspace</StatusLabel>
          <Content component="small">Sample data only · integrations are not connected</Content>
        </div>
      </PageSidebarBody>
    </PageSidebar>
  );
  return (
    <>
      <Page masthead={masthead} sidebar={sidebar} isManagedSidebar defaultManagedSidebarIsOpen={sidebarOpen}>
        <PageSection isFilled className="studio-page-section">
          <div className="studio-content">
            <Breadcrumb>
              <BreadcrumbItem
                to="#applications"
                isActive={view === 'applications'}
                onClick={() => navigate('applications')}
              >
                Applications
              </BreadcrumbItem>
              {view !== 'applications' && (
                <BreadcrumbItem isActive>{isPolicyControlView ? workspaceScopeLabel : activeApp.name}</BreadcrumbItem>
              )}
            </Breadcrumb>
            <div className="studio-page-title">
              <div>
                <Title headingLevel="h1" size="2xl">{viewTitles[view]}</Title>
                <Content component="p">
                  {view === 'applications'
                      ? `A cross-application view of guardrail coverage, findings, and evaluation freshness · ${workspaceScopeLabel}.`
                    : isPolicyControlView
                      ? `System-wide definitions and project/workspace scope: ${definitionWorkspaceDescription}.`
                      : `${activeApp.name} · ${activeApp.harness} · ${activeApp.model} · ${activeApp.environment} · ${activeApp.version}`}
                </Content>
              </div>
              <div className="studio-title-actions">
                {isApplicationSafetyView && (
                  <StatusLabel severity={activeApp.openFindings ? 'warning' : 'success'}>{activeApp.posture}</StatusLabel>
                )}
                {isApplicationSafetyView && (
                  <FormSelect
                    aria-label="Select application for application safety"
                    className="studio-active-application-select"
                    value={appId}
                    onChange={(_event, value) => {
                      setAppId(value);
                      setView('overview');
                      window.location.hash = `#application/${value}`;
                    }}
                  >
                    {scopedApplications.map((app) => (
                      <FormSelectOption key={app.id} value={app.id} label={app.name} />
                    ))}
                  </FormSelect>
                )}
              </div>
            </div>
            <Alert
              variant="info"
              isInline
              title="Illustrative prototype data"
              className="studio-prototype-alert"
            >
              Values and evaluation results are sample data for this UX prototype. No customer data or live platform systems are connected.
            </Alert>
            <div id="studio-notifications" hidden={!notificationsOpen}>
              {notificationsOpen && (
                <Alert
                  variant="info"
                  isInline
                  isLiveRegion
                  title="No new notifications"
                  className="studio-feedback-alert"
                >
                  Application findings and evaluation updates appear here in the connected product.
                </Alert>
              )}
            </div>
            {createdPolicyName && view === 'policy' && (
              <Alert
                variant="success"
                isInline
                isLiveRegion
                title="Policy document added"
                className="studio-feedback-alert"
              >
                {createdPolicyName} appears in Policy documents as a local intake draft. No external system was updated.
              </Alert>
            )}
            {view === 'applications' && <ApplicationsView apps={scopedApplications} onOpen={openApplication} />}
            {view === 'overview' && <OverviewView app={activeApp} onNavigate={navigate} />}
            {view === 'policy' && (
              <PolicyView
                onNavigate={navigate}
                policyDocuments={policyDocuments}
                policyMappingPolicyIds={policyMappingPolicyIds}
                onStartPolicyIntake={() => setIntakeOpen(true)}
                onSetPolicyMappingPolicies={(mappingId, policyIds) => setPolicyMappingPolicyIds((current) => ({ ...current, [mappingId]: policyIds }))}
                onEditPolicyDocument={(documentId, title, version, status) => setPolicyDocuments((current) => current.map((document) => {
                  if (document.id !== documentId) return document;
                  return {
                    ...document,
                    status,
                    ...(document.status === 'Draft' || status === 'Draft' ? { title, version } : {}),
                  };
                }))}
                onRemovePolicyDocument={(documentId) => {
                  if (policyDocuments.find((document) => document.id === documentId)?.status !== 'Retired') return;
                  setPolicyDocuments((current) => current.filter((document) => document.id !== documentId));
                  setPolicyMappingPolicyIds((current) => Object.fromEntries(
                    Object.entries(current).map(([mappingId, policyIds]) => [mappingId, policyIds.filter((policyId) => policyId !== documentId)]),
                  ));
                }}
              />
            )}
            {view === 'guardrails' && <GuardrailsView onNavigate={navigate} />}
            {view === 'evaluations' && (
              <EvaluationsView
                queued={evaluationQueued}
                onQueue={() => setEvaluationQueued(true)}
              />
            )}
            {view === 'monitoring' && (
              <MonitoringView
                key={activeApp.id}
                app={activeApp}
                selectedGuardrailIds={applicationGuardrailIdsByApp[activeApp.id] ?? []}
                onApplySelection={(ids) => setApplicationGuardrailIdsByApp((current) => ({ ...current, [activeApp.id]: ids }))}
              />
            )}
          </div>
        </PageSection>
      </Page>
      <PolicyIntakeDialog
        isOpen={intakeOpen}
        scope={selectedWorkspaceIds.includes(allWorkspacesScope)
          ? 'All projects/workspaces'
          : selectedWorkspaceIds.map(labelForWorkspace).join(', ')}
        onClose={() => setIntakeOpen(false)}
        onCreate={(document) => {
          setPolicyDocuments((current) => [document, ...current]);
          setCreatedPolicyName(document.title);
          setIntakeOpen(false);
          setView('policy');
        }}
      />
    </>
  );
}
