import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Checkbox, Content, FormGroup, FormSelect, FormSelectOption, Label, Modal, ModalBody, ModalFooter, ModalHeader, Pagination, SearchInput, Page, Select, TextArea, TextInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { FileAltIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { policyMappingRecords } from '../data/policies';
import { guardrails } from '../data/guardrails';
import { StatusLabel, SectionHeading, createDummyPolicyMarkdown, renderPolicyMarkdown, StatusCell } from '../components/shared';
import type { ViewId, Severity, PolicyDocumentStatus, PolicyDocument } from '../types';
export function PolicyView({
  onNavigate,
  policyDocuments,
  policyMappingPolicyIds,
  onStartPolicyIntake,
  onSetPolicyMappingPolicies,
  onEditPolicyDocument,
  onRemovePolicyDocument,
}: {
  onNavigate: (view: ViewId) => void;
  policyDocuments: PolicyDocument[];
  policyMappingPolicyIds: Record<string, string[]>;
  onStartPolicyIntake: () => void;
  onSetPolicyMappingPolicies: (mappingId: string, policyIds: string[]) => void;
  onEditPolicyDocument: (documentId: string, title: string, version: string, status: PolicyDocumentStatus) => void;
  onRemovePolicyDocument: (documentId: string) => void;
}) {
  const [policyQuery, setPolicyQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [policyPage, setPolicyPage] = useState(1);
  const [policyRowsPerPage, setPolicyRowsPerPage] = useState(10);
  const [policyDocumentQuery, setPolicyDocumentQuery] = useState('');
  const [policyDocumentStatusFilter, setPolicyDocumentStatusFilter] = useState('all');
  const [policyDocumentPage, setPolicyDocumentPage] = useState(1);
  const [mappingPolicyQuery, setMappingPolicyQuery] = useState('');
  const [mappingPolicyPage, setMappingPolicyPage] = useState(1);
  const [mappingPolicyRowsPerPage, setMappingPolicyRowsPerPage] = useState(5);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [viewingPolicyMappingId, setViewingPolicyMappingId] = useState<string | null>(null);
  const [previewingPolicyId, setPreviewingPolicyId] = useState<string | null>(null);
  const [policyMarkdownDrafts, setPolicyMarkdownDrafts] = useState<Record<string, string>>({});
  const [policyMarkdownEditText, setPolicyMarkdownEditText] = useState('');
  const [isEditingPolicyMarkdown, setIsEditingPolicyMarkdown] = useState(false);
  const [draftPolicyIds, setDraftPolicyIds] = useState<string[]>([]);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editingPolicyTitle, setEditingPolicyTitle] = useState('');
  const [editingPolicyVersion, setEditingPolicyVersion] = useState('');
  const [editingPolicyStatus, setEditingPolicyStatus] = useState<PolicyDocumentStatus>('Draft');
  const [removingPolicyId, setRemovingPolicyId] = useState<string | null>(null);
  const policyDocumentsPerPage = 5;
  const policyDocumentStatuses: PolicyDocumentStatus[] = ['Draft', 'Active', 'Retired'];
  const filteredMappingPolicyDocuments = policyDocuments.filter((document) =>
    document.title.toLowerCase().includes(mappingPolicyQuery.trim().toLowerCase()),
  );
  const visibleMappingPolicyDocuments = filteredMappingPolicyDocuments.slice(
    (mappingPolicyPage - 1) * mappingPolicyRowsPerPage,
    mappingPolicyPage * mappingPolicyRowsPerPage,
  );
  const mappingPolicyPageCount = Math.ceil(filteredMappingPolicyDocuments.length / mappingPolicyRowsPerPage);
  const mappingPolicyPageLabel = mappingPolicyPageCount > 0
    ? `Page ${mappingPolicyPage} of ${mappingPolicyPageCount}`
    : '0 pages';
  const mappingPolicyPaginationTitles = {
    items: 'policy documents',
    paginationAriaLabel: 'Policy document selection pagination',
    optionsToggleAriaLabel: 'Policy documents per page in mapping editor',
  };
  const filteredPolicyDocuments = policyDocuments.filter((document) =>
    document.title.toLowerCase().includes(policyDocumentQuery.trim().toLowerCase())
      && (policyDocumentStatusFilter === 'all' || document.status === policyDocumentStatusFilter),
  );
  const visiblePolicyDocuments = filteredPolicyDocuments.slice(
    (policyDocumentPage - 1) * policyDocumentsPerPage,
    policyDocumentPage * policyDocumentsPerPage,
  );
  const policyDocumentPageCount = Math.ceil(filteredPolicyDocuments.length / policyDocumentsPerPage);
  const policyDocumentPageLabel = policyDocumentPageCount > 0
    ? `Page ${policyDocumentPage} of ${policyDocumentPageCount}`
    : '0 pages';
  const policyDocumentPaginationTitles = {
    items: 'policy documents',
    paginationAriaLabel: 'Policy documents pagination',
  };
  useEffect(() => {
    setPolicyDocumentPage(1);
    setPolicyDocumentQuery('');
    setPolicyDocumentStatusFilter('all');
  }, [policyDocuments.length]);
  const policyReviewStatuses = Array.from(new Set(policyMappingRecords.map((item) => item.status)));
  const filteredPolicyMappings = policyMappingRecords.filter((item) => {
    const searchableText = `${item.clause} ${item.requirement} ${item.risk} ${item.evidence} ${item.status}`.toLowerCase();
    return searchableText.includes(policyQuery.trim().toLowerCase())
      && (reviewStatusFilter === 'all' || item.status === reviewStatusFilter);
  });
  const visiblePolicyMappings = filteredPolicyMappings.slice((policyPage - 1) * policyRowsPerPage, policyPage * policyRowsPerPage);
  const reviewRequiredCount = policyMappingRecords.filter((item) => item.status !== 'Approved').length;
  const policyPaginationTitles = {
    items: 'policy mappings',
    paginationAriaLabel: 'Policy mapping review pagination',
    optionsToggleAriaLabel: 'Policy mappings per page',
  };
  const handlePolicyPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setPolicyPage(page);
  const handlePolicyRowsPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    page: number,
  ) => {
    setPolicyRowsPerPage(perPage);
    setPolicyPage(page);
  };
  const clearPolicyFilters = () => {
    setPolicyQuery('');
    setReviewStatusFilter('all');
    setPolicyPage(1);
  };
  const clearPolicyDocumentFilters = () => {
    setPolicyDocumentQuery('');
    setPolicyDocumentStatusFilter('all');
    setPolicyDocumentPage(1);
  };
  const handlePolicyDocumentPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setPolicyDocumentPage(page);
  const handleMappingPolicyPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => setMappingPolicyPage(page);
  const handleMappingPolicyRowsPerPage = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    page: number,
  ) => {
    setMappingPolicyRowsPerPage(perPage);
    setMappingPolicyPage(page);
  };
  const openPolicyMappingEditor = (mappingId: string) => {
    const mapping = policyMappingRecords.find((item) => item.clause === mappingId);
    setDraftPolicyIds(policyMappingPolicyIds[mappingId] ?? mapping?.policyIds ?? []);
    setMappingPolicyQuery('');
    setMappingPolicyPage(1);
    setMappingPolicyRowsPerPage(5);
    setEditingMappingId(mappingId);
  };
  const savePolicyMapping = () => {
    if (!editingMappingId || draftPolicyIds.length === 0) return;
    onSetPolicyMappingPolicies(editingMappingId, draftPolicyIds);
    setEditingMappingId(null);
  };
  const editingMapping = policyMappingRecords.find((item) => item.clause === editingMappingId);
  const viewingPolicyMapping = policyMappingRecords.find((item) => item.clause === viewingPolicyMappingId);
  const viewingLinkedPolicies = viewingPolicyMapping
    ? policyDocuments.filter((document) => (policyMappingPolicyIds[viewingPolicyMapping.clause] ?? viewingPolicyMapping.policyIds).includes(document.id))
    : [];
  const previewingPolicy = policyDocuments.find((document) => document.id === previewingPolicyId);
  const previewPolicyMarkdown = previewingPolicy
    ? policyMarkdownDrafts[previewingPolicy.id] ?? createDummyPolicyMarkdown(previewingPolicy)
    : '';
  const policyToEdit = policyDocuments.find((document) => document.id === editingPolicyId);
  const policyToRemove = policyDocuments.find((document) => document.id === removingPolicyId && document.status === 'Retired');
  const openPolicyEditor = (document: PolicyDocument) => {
    setEditingPolicyId(document.id);
    setEditingPolicyTitle(document.title);
    setEditingPolicyVersion(document.version);
    setEditingPolicyStatus(document.status);
  };
  const openPolicyPreview = (document: PolicyDocument) => {
    setPolicyMarkdownEditText(policyMarkdownDrafts[document.id] ?? createDummyPolicyMarkdown(document));
    setIsEditingPolicyMarkdown(false);
    setPreviewingPolicyId(document.id);
  };
  const savePolicyMarkdown = () => {
    if (!previewingPolicy) return;
    setPolicyMarkdownDrafts((current) => ({ ...current, [previewingPolicy.id]: policyMarkdownEditText }));
    setIsEditingPolicyMarkdown(false);
  };
  const cancelPolicyMarkdownEdit = () => {
    setPolicyMarkdownEditText(previewPolicyMarkdown);
    setIsEditingPolicyMarkdown(false);
  };
  const savePolicyEdits = () => {
    if (!policyToEdit || !editingPolicyTitle.trim() || !editingPolicyVersion.trim()) return;
    onEditPolicyDocument(policyToEdit.id, editingPolicyTitle.trim(), editingPolicyVersion.trim(), editingPolicyStatus);
    setEditingPolicyId(null);
  };
  const requestPolicyRemoval = () => {
    if (!policyToEdit || policyToEdit.status !== 'Retired') return;
    setEditingPolicyId(null);
    setRemovingPolicyId(policyToEdit.id);
  };
  const confirmPolicyRemoval = () => {
    if (!policyToRemove) return;
    onRemovePolicyDocument(policyToRemove.id);
    setRemovingPolicyId(null);
  };
  return (
    <>
      <SectionHeading
        title="Policy requirements and mapped risks"
        description="ASAGO-aligned mappings connect source clauses to risk evidence and candidate controls. Mappings remain reviewable proposals."
      />
      <Card aria-label="Policy documents" className="studio-policy-documents-card">
        <CardHeader>
          <div className="studio-policy-documents-heading">
            <CardTitle component="h2">Policy documents</CardTitle>
            <StatusLabel severity="info">{policyDocuments.length} documents</StatusLabel>
          </div>
          <div className="studio-policy-documents-header-actions">
            <Button variant="primary" onClick={onStartPolicyIntake}>
              <FileAltIcon /> Start policy intake
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <Content component="p" className="studio-muted">
            Policies started through intake land here. Link mapping records to one or more documents to keep source context with each requirement.
          </Content>
          <Toolbar id="policy-documents-toolbar" aria-label="Policy document search, status filter, and pagination">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search policy documents by name"
                  className="studio-policy-documents-search"
                  placeholder="Search policy names"
                  value={policyDocumentQuery}
                  resultsCount={filteredPolicyDocuments.length}
                  resultsCountContext=" matching policy documents"
                  onChange={(_event, value) => {
                    setPolicyDocumentQuery(value);
                    setPolicyDocumentPage(1);
                  }}
                  onClear={() => {
                    setPolicyDocumentQuery('');
                    setPolicyDocumentPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter policy documents by status"
                  className="studio-policy-documents-status-filter"
                  value={policyDocumentStatusFilter}
                  onChange={(_event, value) => {
                    setPolicyDocumentStatusFilter(value);
                    setPolicyDocumentPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All document statuses" />
                  {policyDocumentStatuses.map((status) => <FormSelectOption key={status} value={status} label={status} />)}
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                <span className="studio-pagination-page-indicator" aria-live="polite">{policyDocumentPageLabel}</span>
                <Pagination
                  variant="top"
                  isCompact
                  widgetId="policy-documents-top"
                  itemCount={filteredPolicyDocuments.length}
                  page={policyDocumentPage}
                  perPage={policyDocumentsPerPage}
                  perPageOptions={[]}
                  titles={policyDocumentPaginationTitles}
                  onSetPage={handlePolicyDocumentPage}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table aria-label="Policy documents from intake" variant="compact" gridBreakPoint="grid-md">
            <Thead>
              <Tr>
                <Th width={25}>Policy document</Th>
                <Th width={25}>Intake source</Th>
                <Th width={20}>Project/workspace</Th>
                <Th width={10}>Mappings</Th>
                <Th width={10}>Status</Th>
                <Th width={10}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visiblePolicyDocuments.length > 0 ? visiblePolicyDocuments.map((document) => {
                const mappingCount = policyMappingRecords.filter((item) =>
                  (policyMappingPolicyIds[item.clause] ?? item.policyIds).includes(document.id),
                ).length;
                const statusSeverity: Severity = document.status === 'Active' ? 'success' : document.status === 'Draft' ? 'info' : 'warning';
                return (
                  <Tr key={document.id}>
                    <Td dataLabel="Policy document">
                      <strong>
                        <a
                          className="studio-policy-document-link"
                          href={`#policy-document-${encodeURIComponent(document.id)}`}
                          onClick={(event) => {
                            event.preventDefault();
                            openPolicyPreview(document);
                          }}
                        >
                          {document.title}
                        </a>
                      </strong>
                      <Content component="small" className="studio-catalog-description">{document.version} · Added {document.createdAt}</Content>
                    </Td>
                    <Td dataLabel="Intake source">
                      {document.source}
                      {document.sourceReference && (
                        <Content component="small" className="studio-policy-source-reference">
                          {document.sourceReference}
                        </Content>
                      )}
                      {document.assertionsConfigYaml && (
                        <Content component="small" className="studio-policy-source-reference">
                          Inline YAML parameters supplied · {document.assertionsConfigYaml.split(/\r\n|\r|\n/).length} lines
                        </Content>
                      )}
                      {document.mappingProvenance && (
                        <Content component="small" className="studio-policy-source-reference">
                          Risk catalogue: {document.mappingProvenance.riskCatalogue}
                        </Content>
                      )}
                    </Td>
                    <Td dataLabel="Project/workspace">{document.scope}</Td>
                    <Td dataLabel="Mappings">{mappingCount}</Td>
                    <Td dataLabel="Status"><StatusCell severity={statusSeverity} text={document.status} /></Td>
                    <Td dataLabel="Actions">
                      <Button variant="link" onClick={() => openPolicyEditor(document)}>Edit</Button>
                    </Td>
                  </Tr>
                );
              }) : (
                <Tr>
                  <Td colSpan={6} dataLabel="Search result">
                    <div className="studio-inventory-empty">
                      <Content component="p">No policy documents match the name and status filters.</Content>
                      <Button variant="link" onClick={clearPolicyDocumentFilters}>Clear filters</Button>
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          <div className="studio-policy-documents-pagination">
            <span className="studio-pagination-page-indicator" aria-live="polite">{policyDocumentPageLabel}</span>
            <Pagination
              variant="bottom"
              isCompact
              widgetId="policy-documents-bottom"
              itemCount={filteredPolicyDocuments.length}
              page={policyDocumentPage}
              perPage={policyDocumentsPerPage}
              perPageOptions={[]}
              titles={policyDocumentPaginationTitles}
              onSetPage={handlePolicyDocumentPage}
            />
          </div>
        </CardBody>
      </Card>
      <Card aria-label="Policy mapping records">
        <CardHeader>
          <CardTitle component="h2">Policy mapping review</CardTitle>
          <StatusLabel severity="warning">{reviewRequiredCount} items need review</StatusLabel>
        </CardHeader>
        <CardBody>
          <Toolbar id="policy-mapping-toolbar" aria-label="Policy mapping search, filters, and pagination">
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  aria-label="Search policy mappings"
                  className="studio-policy-review-search"
                  placeholder="Search clauses, risks, or evidence"
                  value={policyQuery}
                  resultsCount={filteredPolicyMappings.length}
                  resultsCountContext=" matching policy mappings"
                  onChange={(_event, value) => {
                    setPolicyQuery(value);
                    setPolicyPage(1);
                  }}
                  onClear={() => {
                    setPolicyQuery('');
                    setPolicyPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <FormSelect
                  aria-label="Filter policy mappings by review status"
                  className="studio-policy-review-status-filter"
                  value={reviewStatusFilter}
                  onChange={(_event, value) => {
                    setReviewStatusFilter(value);
                    setPolicyPage(1);
                  }}
                >
                  <FormSelectOption value="all" label="All review statuses" />
                  {policyReviewStatuses.map((status) => <FormSelectOption key={status} value={status} label={status} />)}
                </FormSelect>
              </ToolbarItem>
              <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                <Pagination
                  variant="top"
                  isCompact
                  widgetId="policy-mapping-review-top"
                  itemCount={filteredPolicyMappings.length}
                  page={policyPage}
                  perPage={policyRowsPerPage}
                  perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
                  titles={policyPaginationTitles}
                  onSetPage={handlePolicyPage}
                  onPerPageSelect={handlePolicyRowsPerPage}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table aria-label="Policy requirements mapped to risks" variant="compact" gridBreakPoint="grid-md">
            <Thead>
              <Tr>
                <Th>Source requirement</Th>
                <Th>Policies</Th>
                <Th>Mapped risk</Th>
                <Th>Evidence</Th>
                <Th>Review status</Th>
                <Th screenReaderText="Actions" />
              </Tr>
            </Thead>
            <Tbody>
              {visiblePolicyMappings.length > 0 ? visiblePolicyMappings.map((item) => {
                const linkedPolicyIds = policyMappingPolicyIds[item.clause] ?? item.policyIds;
                const linkedPolicies = policyDocuments.filter((document) => linkedPolicyIds.includes(document.id));
                const visibleLinkedPolicies = linkedPolicies.slice(0, 2);
                const additionalPolicyCount = Math.max(0, linkedPolicies.length - visibleLinkedPolicies.length);
                return (
                  <Tr key={item.clause}>
                    <Td dataLabel="Source requirement">
                      <strong>{item.clause}</strong>
                      <Content component="p" className="studio-table-detail">{item.requirement}</Content>
                    </Td>
                    <Td dataLabel="Policies">
                      <div className="studio-policy-mapping-documents">
                        {visibleLinkedPolicies.map((document) => <Label key={document.id}>{document.title} · {document.version}</Label>)}
                        {additionalPolicyCount > 0 && (
                          <Button
                            variant="plain"
                            className="studio-policy-more-pill"
                            aria-label={`Show all ${linkedPolicies.length} linked policies for ${item.clause}`}
                            onClick={() => setViewingPolicyMappingId(item.clause)}
                          >
                            +{additionalPolicyCount}
                          </Button>
                        )}
                      </div>
                    </Td>
                    <Td dataLabel="Mapped risk">{item.risk}</Td>
                    <Td dataLabel="Evidence">{item.evidence}</Td>
                    <Td dataLabel="Review status"><StatusCell severity={item.severity} text={item.status} /></Td>
                    <Td dataLabel="Actions">
                      <div className="studio-policy-mapping-actions">
                        <Button variant="link" onClick={() => openPolicyMappingEditor(item.clause)}>Manage policies</Button>
                        <Button variant="link" onClick={() => onNavigate('guardrails')}>View controls</Button>
                      </div>
                    </Td>
                  </Tr>
                );
              }) : (
                <Tr>
                  <Td colSpan={6} dataLabel="Search result">
                    <div className="studio-inventory-empty">
                      <Content component="p">No policy mappings match the search and status filter.</Content>
                      <Button variant="link" onClick={clearPolicyFilters}>Clear filters</Button>
                    </div>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
          <Pagination
            className="studio-policy-review-pagination"
            variant="bottom"
            isCompact
            widgetId="policy-mapping-review-bottom"
            itemCount={filteredPolicyMappings.length}
            page={policyPage}
            perPage={policyRowsPerPage}
            perPageOptions={[{ title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
            titles={policyPaginationTitles}
            onSetPage={handlePolicyPage}
            onPerPageSelect={handlePolicyRowsPerPage}
          />
        </CardBody>
      </Card>
      <Modal
        variant="large"
        isOpen={Boolean(previewingPolicy)}
        onClose={() => {
          setPreviewingPolicyId(null);
          setIsEditingPolicyMarkdown(false);
        }}
        aria-labelledby="policy-document-preview-title"
        aria-describedby="policy-document-preview-description"
      >
        <ModalHeader
          title={previewingPolicy?.title ?? 'Policy document'}
          labelId="policy-document-preview-title"
          description={previewingPolicy ? `${previewingPolicy.version} · ${previewingPolicy.status} · ${previewingPolicy.scope}` : 'View policy markdown.'}
          descriptorId="policy-document-preview-description"
        />
        <ModalBody>
          {isEditingPolicyMarkdown ? (
            <FormGroup label="Policy markdown" fieldId="policy-document-markdown-editor" isRequired>
              <TextArea
                id="policy-document-markdown-editor"
                aria-label="Edit policy markdown"
                value={policyMarkdownEditText}
                rows={20}
                onChange={(_event, value) => setPolicyMarkdownEditText(value)}
              />
            </FormGroup>
          ) : (
            <>
              <Alert variant="info" isInline title="Mock policy content">
                In a future version, this popup will display the actual policy markdown. This sample is for preview and editing interactions only.
              </Alert>
              <div className="studio-policy-markdown-preview" aria-label="Rendered policy markdown">
                {renderPolicyMarkdown(previewPolicyMarkdown)}
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {isEditingPolicyMarkdown ? (
            <>
              <Button variant="primary" onClick={savePolicyMarkdown} isDisabled={!policyMarkdownEditText.trim()}>Save markdown</Button>
              <Button variant="link" onClick={cancelPolicyMarkdownEdit}>Cancel editing</Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => setIsEditingPolicyMarkdown(true)}>Edit markdown</Button>
              <Button variant="link" onClick={() => setPreviewingPolicyId(null)}>Close</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
      <Modal
        variant="small"
        isOpen={Boolean(policyToEdit)}
        onClose={() => setEditingPolicyId(null)}
        aria-labelledby="edit-policy-title"
        aria-describedby="edit-policy-description"
      >
        <ModalHeader
          title="Edit policy"
          labelId="edit-policy-title"
          description={policyToEdit?.title ?? 'Update this policy and its status.'}
          descriptorId="edit-policy-description"
        />
        <ModalBody>
          <FormGroup label="Status" fieldId="edit-policy-status" isRequired>
            <FormSelect
              id="edit-policy-status"
              value={editingPolicyStatus}
              onChange={(_event, value) => setEditingPolicyStatus(value as PolicyDocumentStatus)}
            >
              {policyDocumentStatuses.map((status) => <FormSelectOption key={status} value={status} label={status} />)}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Policy name" fieldId="edit-policy-name" isRequired={editingPolicyStatus === 'Draft'}>
            <TextInput
              isRequired={editingPolicyStatus === 'Draft'}
              isDisabled={editingPolicyStatus !== 'Draft'}
              id="edit-policy-name"
              value={editingPolicyTitle}
              onChange={(_event, value) => setEditingPolicyTitle(value)}
            />
          </FormGroup>
          <FormGroup label="Policy version" fieldId="edit-policy-version" isRequired={editingPolicyStatus === 'Draft'}>
            <TextInput
              isRequired={editingPolicyStatus === 'Draft'}
              isDisabled={editingPolicyStatus !== 'Draft'}
              id="edit-policy-version"
              value={editingPolicyVersion}
              onChange={(_event, value) => setEditingPolicyVersion(value)}
            />
          </FormGroup>
          <Content component="small" className="studio-muted">
            Choose a status here. Policy name and version can be edited only while the policy is Draft.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={savePolicyEdits} isDisabled={!editingPolicyTitle.trim() || !editingPolicyVersion.trim() || !policyToEdit}>Save changes</Button>
          {policyToEdit?.status === 'Retired' && (
            <Button variant="danger" onClick={requestPolicyRemoval}>Remove policy</Button>
          )}
          <Button variant="link" onClick={() => setEditingPolicyId(null)}>Cancel</Button>
        </ModalFooter>
      </Modal>
      <Modal
        variant="small"
        isOpen={Boolean(policyToRemove)}
        onClose={() => setRemovingPolicyId(null)}
        aria-labelledby="remove-policy-title"
        aria-describedby="remove-policy-description"
      >
        <ModalHeader
          title="Remove retired policy?"
          labelId="remove-policy-title"
          description={policyToRemove?.title ?? 'Confirm removal of this retired policy document.'}
          descriptorId="remove-policy-description"
        />
        <ModalBody>
          <Content component="p">
            This removes the policy document from the list and clears its links from policy mappings. Only retired policies can be removed.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={confirmPolicyRemoval} isDisabled={!policyToRemove}>Remove policy</Button>
          <Button variant="link" onClick={() => setRemovingPolicyId(null)}>Cancel</Button>
        </ModalFooter>
      </Modal>
      <Modal
        variant="medium"
        isOpen={Boolean(editingMapping)}
        onClose={() => setEditingMappingId(null)}
        aria-labelledby="policy-mapping-editor-title"
        aria-describedby="policy-mapping-editor-description"
      >
        <ModalHeader
          title="Manage linked policies"
          labelId="policy-mapping-editor-title"
          description={editingMapping?.clause ?? 'Choose the policy documents that support this mapping.'}
          descriptorId="policy-mapping-editor-description"
        />
        <ModalBody>
          <Content component="p">
            Select one or more policy documents associated with this requirement. {draftPolicyIds.length} selected.
          </Content>
          <SearchInput
            aria-label="Search policy documents to link"
            className="studio-policy-mapping-document-search"
            placeholder="Search policy names"
            value={mappingPolicyQuery}
            resultsCount={filteredMappingPolicyDocuments.length}
            resultsCountContext=" matching policy documents"
            onChange={(_event, value) => {
              setMappingPolicyQuery(value);
              setMappingPolicyPage(1);
            }}
            onClear={() => {
              setMappingPolicyQuery('');
              setMappingPolicyPage(1);
            }}
          />
          <div className="studio-policy-mapping-picker-pagination">
            <span className="studio-pagination-page-indicator" aria-live="polite">{mappingPolicyPageLabel}</span>
            <Pagination
              variant="top"
              isCompact
              widgetId="policy-mapping-documents-top"
              itemCount={filteredMappingPolicyDocuments.length}
              page={mappingPolicyPage}
              perPage={mappingPolicyRowsPerPage}
              perPageOptions={[{ title: '5', value: 5 }, { title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
              titles={mappingPolicyPaginationTitles}
              onSetPage={handleMappingPolicyPage}
              onPerPageSelect={handleMappingPolicyRowsPerPage}
            />
          </div>
          <div className="studio-policy-document-options">
            {visibleMappingPolicyDocuments.map((document) => (
              <Checkbox
                key={document.id}
                id={`mapping-policy-${document.id}`}
                aria-label={`${document.title}, ${document.version}, ${document.status}`}
                label={`${document.title} · ${document.version} · ${document.status}`}
                isChecked={draftPolicyIds.includes(document.id)}
                onChange={(_event, checked) => setDraftPolicyIds((current) => checked
                  ? [...current, document.id]
                  : current.filter((id) => id !== document.id))}
              />
            ))}
          </div>
          {filteredMappingPolicyDocuments.length === 0 && (
            <div className="studio-inventory-empty">
              <Content component="p">No policy documents match this search.</Content>
              <Button variant="link" onClick={() => { setMappingPolicyQuery(''); setMappingPolicyPage(1); }}>Clear search</Button>
            </div>
          )}
          <div className="studio-policy-mapping-picker-pagination">
            <span className="studio-pagination-page-indicator" aria-live="polite">{mappingPolicyPageLabel}</span>
            <Pagination
              variant="bottom"
              isCompact
              widgetId="policy-mapping-documents-bottom"
              itemCount={filteredMappingPolicyDocuments.length}
              page={mappingPolicyPage}
              perPage={mappingPolicyRowsPerPage}
              perPageOptions={[{ title: '5', value: 5 }, { title: '10', value: 10 }, { title: '20', value: 20 }, { title: '50', value: 50 }, { title: '100', value: 100 }]}
              titles={mappingPolicyPaginationTitles}
              onSetPage={handleMappingPolicyPage}
              onPerPageSelect={handleMappingPolicyRowsPerPage}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={savePolicyMapping} isDisabled={draftPolicyIds.length === 0}>Save policy links</Button>
          <Button variant="link" onClick={() => setEditingMappingId(null)}>Cancel</Button>
        </ModalFooter>
      </Modal>
      <Modal
        variant="medium"
        isOpen={Boolean(viewingPolicyMapping)}
        onClose={() => setViewingPolicyMappingId(null)}
        aria-labelledby="linked-policy-list-title"
        aria-describedby="linked-policy-list-description"
      >
        <ModalHeader
          title="Linked policies"
          labelId="linked-policy-list-title"
          description={viewingPolicyMapping?.clause ?? 'Policy documents linked to this requirement.'}
          descriptorId="linked-policy-list-description"
        />
        <ModalBody>
          <Content component="p">{viewingLinkedPolicies.length} policy documents are linked to this requirement.</Content>
          <div className="studio-linked-policy-list" role="list" aria-label="All linked policy documents">
            {viewingLinkedPolicies.map((document) => (
              <div className="studio-linked-policy-list-item" key={document.id} role="listitem">
                <span>{document.title}</span>
                <span className="studio-linked-policy-metadata">{document.version} · {document.status}</span>
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={() => setViewingPolicyMappingId(null)}>Close</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
