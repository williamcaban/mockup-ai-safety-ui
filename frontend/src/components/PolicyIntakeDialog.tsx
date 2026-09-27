import { useState } from 'react';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  FileUpload,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
  Content,
} from '@patternfly/react-core';
import { parseGuardrailConfigYaml } from './shared';
import { isHttpUrl } from '../utils/validation';
import type { PolicyDocument, PolicyIntakeSource } from '../types';

type PolicyIntakePath = 'document' | 'assertions';

type PolicyIntakeDialogProps = {
  isOpen: boolean;
  scope: string;
  onClose: () => void;
  onCreate: (document: PolicyDocument) => void;
};

export function PolicyIntakeDialog({ isOpen, scope, onClose, onCreate }: PolicyIntakeDialogProps) {
  const [title, setTitle] = useState('');
  const [intakePath, setIntakePath] = useState<PolicyIntakePath>('document');
  const [sourceType, setSourceType] = useState<PolicyIntakeSource>('file');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [riskCatalogue, setRiskCatalogue] = useState('AI Risk Atlas / Nexus · 2026.09');
  const [assertionsYaml, setAssertionsYaml] = useState('');

  const assertionsYamlError = (() => {
    if (!assertionsYaml.trim()) return '';
    try {
      parseGuardrailConfigYaml(assertionsYaml);
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'The YAML could not be parsed.';
    }
  })();
  const sourceReady = intakePath === 'assertions'
    ? !assertionsYaml.trim() || !assertionsYamlError
    : sourceType === 'file' ? Boolean(sourceFile) : isHttpUrl(sourceUrl.trim());

  const handleAssertionsYamlKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const editor = event.currentTarget;
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
    setAssertionsYaml(updatedText);
    requestAnimationFrame(() => editor.setSelectionRange(nextSelectionStart, nextSelectionEnd));
  };

  const handleSubmit = () => {
    const policyTitle = title.trim();
    if (!policyTitle || !sourceReady) return;
    const sourceReference = intakePath === 'document'
      ? sourceType === 'file' ? sourceFile?.name : sourceUrl.trim()
      : undefined;
    const document: PolicyDocument = {
      id: `policy-${Date.now()}`,
      title: policyTitle,
      version: 'v0.1',
      source: intakePath === 'document'
        ? `ASAGO Policy Mapper · ${sourceType === 'file' ? 'File upload' : 'URL import'}`
        : 'Structured assertions · adapter required',
      sourceReference,
      assertionsConfigYaml: intakePath === 'assertions' ? assertionsYaml.trim() || undefined : undefined,
      mappingProvenance: intakePath === 'document' ? {
        mapper: 'ASAGO Policy Mapper · adapter 0.3',
        riskCatalogue,
      } : undefined,
      scope,
      status: 'Draft',
      createdAt: 'Just now',
    };
    onCreate(document);
    setTitle('');
    setSourceFile(null);
    setSourceUrl('');
    setSourceType('file');
    setRiskCatalogue('AI Risk Atlas / Nexus · 2026.09');
    setAssertionsYaml('');
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="policy-intake-title"
      aria-describedby="policy-intake-description"
    >
      <ModalHeader
        title="Start a policy intake"
        labelId="policy-intake-title"
        description="Create a system-wide or project/workspace policy draft. This prototype stores the draft in local UI state only."
        descriptorId="policy-intake-description"
      />
      <ModalBody>
        <FormGroup label="Policy or requirement set name" fieldId="policy-title" isRequired>
          <TextInput
            isRequired
            id="policy-title"
            value={title}
            onChange={(_event, value) => setTitle(value)}
            placeholder="For example, Customer data handling policy"
          />
        </FormGroup>
        <FormGroup label="Intake path" fieldId="policy-source">
          <FormSelect id="policy-source" value={intakePath} onChange={(_event, value) => setIntakePath(value as PolicyIntakePath)}>
            <FormSelectOption value="document" label="Policy document · ASAGO Policy Mapper" />
            <FormSelectOption value="assertions" label="Structured assertions · adapter required" />
          </FormSelect>
        </FormGroup>
        {intakePath === 'document' && (
          <>
            <FormGroup label="Policy source" fieldId="policy-intake-source">
              <FormSelect
                id="policy-intake-source"
                value={sourceType}
                onChange={(_event, value) => {
                  const nextSource = value as PolicyIntakeSource;
                  setSourceType(nextSource);
                  if (nextSource === 'file') setSourceUrl('');
                  else setSourceFile(null);
                }}
              >
                <FormSelectOption value="file" label="Upload or drop a file" />
                <FormSelectOption value="url" label="Import from URL" />
              </FormSelect>
            </FormGroup>
            {sourceType === 'file' ? (
              <FormGroup label="Policy document file" fieldId="policy-document-upload" isRequired>
                <FileUpload
                  id="policy-document-upload"
                  value={sourceFile ?? undefined}
                  filename={sourceFile?.name ?? ''}
                  filenamePlaceholder="Choose a file or drop it here"
                  browseButtonText="Choose policy file"
                  isRequired
                  dropzoneProps={{
                    accept: {
                      'application/pdf': ['.pdf'],
                      'application/msword': ['.doc'],
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                      'text/plain': ['.txt'],
                      'text/markdown': ['.md', '.markdown'],
                    },
                  }}
                  onFileInputChange={(_event, file) => setSourceFile(file)}
                  onClearClick={() => setSourceFile(null)}
                />
                <Content component="small" className="studio-muted">
                  Select a policy file or drag it into the drop area. This prototype records the filename only; file upload to ASAGO and policy extraction are not connected.
                </Content>
              </FormGroup>
            ) : (
              <FormGroup label="Policy URL" fieldId="policy-source-url" isRequired>
                <TextInput
                  isRequired
                  type="url"
                  id="policy-source-url"
                  value={sourceUrl}
                  onChange={(_event, value) => setSourceUrl(value)}
                  placeholder="https://example.com/policies/ai-safety"
                  validated={sourceUrl.trim() && !isHttpUrl(sourceUrl.trim()) ? 'error' : 'default'}
                  aria-describedby="policy-source-url-helper"
                />
                <Content id="policy-source-url-helper" component="small" className="studio-muted">
                  {sourceUrl.trim() && !isHttpUrl(sourceUrl.trim())
                    ? 'Enter a full URL beginning with http:// or https://.'
                    : 'The prototype records this URL only; retrieval and policy extraction are not connected.'}
                </Content>
              </FormGroup>
            )}
            <div className="studio-policy-provenance-fields" aria-labelledby="policy-provenance-heading">
              <Content id="policy-provenance-heading" component="h3">Mapping provenance</Content>
              <Content component="small" className="studio-muted">
                Select the risk catalogue entry used to map this policy. Each entry includes its catalogue version.
              </Content>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Mapper</DescriptionListTerm>
                  <DescriptionListDescription>ASAGO Policy Mapper · adapter 0.3</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <FormGroup label="Risk catalogue entry" fieldId="policy-risk-catalogue" isRequired>
                <FormSelect id="policy-risk-catalogue" value={riskCatalogue} onChange={(_event, value) => setRiskCatalogue(value)}>
                  <FormSelectOption value="AI Risk Atlas / Nexus · 2026.09" label="AI Risk Atlas / Nexus · 2026.09" />
                  <FormSelectOption value="AI Risk Atlas / Nexus · 2026.06" label="AI Risk Atlas / Nexus · 2026.06" />
                </FormSelect>
              </FormGroup>
            </div>
          </>
        )}
        {intakePath === 'assertions' && (
          <FormGroup label="Inline YAML parameters (optional)" fieldId="structured-assertions-yaml">
            <TextArea
              id="structured-assertions-yaml"
              className="studio-policy-assertions-yaml"
              value={assertionsYaml}
              rows={8}
              wrap="off"
              spellCheck={false}
              validated={assertionsYaml.trim() ? assertionsYamlError ? 'error' : 'success' : 'default'}
              onChange={(_event, value) => setAssertionsYaml(value)}
              onKeyDown={handleAssertionsYamlKeyDown}
              placeholder={'# Adapter-specific parameters\nkey: value'}
              aria-describedby="structured-assertions-yaml-helper"
            />
            <Content id="structured-assertions-yaml-helper" component="small" className="studio-muted">
              Add adapter-specific key/value parameters. Tab indents by two spaces; a YAML mapping at the root is required. This prototype stores the configuration locally and does not execute an adapter.
            </Content>
            {assertionsYamlError && <Alert variant="danger" isInline title="YAML needs correction">{assertionsYamlError}</Alert>}
          </FormGroup>
        )}
        <Content component="small" className="studio-muted">
          Mapping results remain proposals until an authorized policy owner reviews the source evidence and mappings.
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleSubmit} isDisabled={!title.trim() || !sourceReady}>
          Create draft
        </Button>
        <Button variant="link" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}
