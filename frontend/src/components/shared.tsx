import { type ReactNode } from 'react';
import { Card, CardBody, Content, Label, Title, Tooltip } from '@patternfly/react-core';
import { CloudIcon, CodeBranchIcon, CubeIcon, FlaskIcon } from '@patternfly/react-icons';
import { parse as parseYaml, parseDocument as parseYamlDocument } from 'yaml';
import { isYamlConfig } from '../data/guardrails';
import type { AppRecord, PolicyDocument, Severity, YamlConfig, YamlValue } from '../types';

export function StatusLabel({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return <Label status={severity} className="studio-status-label">{children}</Label>;
}

export function isValidYamlValue(value: YamlValue): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isValidYamlValue);
  if (isYamlConfig(value)) return Object.entries(value).every(([key, child]) => Boolean(key.trim()) && isValidYamlValue(child));
  return true;
}

export function parseGuardrailConfigYaml(source: string): YamlConfig {
  const parsed = parseYaml(source, { schema: 'core' }) as unknown;
  if (!isYamlConfig(parsed)) throw new Error('The YAML document must have a mapping (key/value object) at its root.');
  if (!isValidYamlValue(parsed)) throw new Error('The YAML document contains an unsupported value or an empty key.');
  return parsed;
}

export function formatGuardrailConfigYaml(source: string) {
  const document = parseYamlDocument(source, { schema: 'core' });
  if (document.errors.length) throw new Error(document.errors[0].message);
  const parsed = document.toJS() as unknown;
  if (!isYamlConfig(parsed)) throw new Error('The YAML document must have a mapping (key/value object) at its root.');
  if (!isValidYamlValue(parsed)) throw new Error('The YAML document contains an unsupported value or an empty key.');
  return document.toString({ lineWidth: 0 });
}

export function EnvironmentGlyph({ environment }: { environment: string }) {
  const iconByEnvironment = {
    Production: CloudIcon,
    Staging: FlaskIcon,
    Development: CodeBranchIcon,
  };
  const EnvironmentIcon = iconByEnvironment[environment as keyof typeof iconByEnvironment] ?? CubeIcon;

  return <EnvironmentIcon aria-hidden="true" />;
}

export function EnvironmentIndicator({ environment }: { environment: string }) {
  return (
    <Tooltip content={`${environment} environment`} position="top">
      <span
        className="studio-environment-icon"
        role="img"
        aria-label={`${environment} environment`}
        tabIndex={0}
      >
        <EnvironmentGlyph environment={environment} />
      </span>
    </Tooltip>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="studio-section-heading">
      <Title headingLevel="h2" size="lg">{title}</Title>
      {description && <Content component="p">{description}</Content>}
    </div>
  );
}

export function MetricCard({ label, value, detail, severity = 'info' }: { label: string; value: string; detail: string; severity?: Severity }) {
  const hasNumericValue = /\d/.test(value);
  return (
    <Card className="studio-metric-card" aria-label={label}>
      <CardBody>
        <Content component="small" className="studio-metric-label">{label}</Content>
        <div className={`studio-metric-value metric-${severity}${hasNumericValue ? ' studio-metric-value--large' : ''}`}>{value}</div>
        <Content component="small" className="studio-muted">{detail}</Content>
      </CardBody>
    </Card>
  );
}

export function createDummyPolicyMarkdown(document: PolicyDocument) {
  return `# ${document.title}\n\n**Version:** ${document.version}\n\n## Purpose\n\nThis sample policy describes the principles, responsibilities, and safeguards for the responsible use of AI systems. Replace this illustrative content with the approved policy text when document storage is connected.\n\n## Policy requirements\n\n- Assign an accountable owner for each AI system and its material risks.\n- Identify, assess, and document risks throughout the system lifecycle.\n- Apply controls that are proportionate to the system's purpose and impact.\n- Retain evidence of reviews, evaluations, incidents, and remediation.\n\n## Review process\n\n1. Review the system purpose, users, data, and risk profile.\n2. Confirm that required controls and evidence are in place.\n3. Record approval, exceptions, and follow-up actions.\n\n## Scope\n\nThis policy applies to teams that design, build, procure, deploy, or operate AI systems in ${document.scope}.\n\n## Accountability matrix\n\n| Role | Responsibility |\n| --- | --- |\n| System owner | Maintains the system record and risk assessment. |\n| Safety reviewer | Reviews evaluation evidence and exceptions. |\n\n> Prototype content: the connected product will load the approved policy Markdown here.\n\n## Review and accountability\n\nThe policy owner reviews this document at least annually and whenever material changes affect its requirements. Exceptions must be documented, approved, and tracked to resolution.\n\n---\n\nFor example, record a risk decision in \x60risk-review.yml\x60 and link it to the system evidence.`;
}

export function renderInlinePolicyMarkdown(text: string, keyPrefix: string) {
  const tokens = text.split(/(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return tokens.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    const image = part.match(/^!\[([^\]]*)\]\(([^ )]+)(?:\s+["'][^)]*["'])?\)$/);
    if (image) {
      const source = image[2];
      return /^(https?:\/\/|\/(?!\/)|\.\.?\/)/i.test(source)
        ? <img key={key} src={source} alt={image[1]} />
        : image[1];
    }
    const link = part.match(/^\[([^\]]+)\]\(([^ )]+)(?:\s+["'][^)]*["'])?\)$/);
    if (link) {
      const href = link[2];
      if (!/^(https?:\/\/|mailto:|#|\/(?!\/)|\.\.?\/)/i.test(href)) return link[1];
      const isExternal = /^https?:\/\//i.test(href);
      return <a key={key} href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined}>{link[1]}</a>;
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={key}>{part.slice(2, -2)}</del>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function renderPolicyMarkdown(markdown: string) {
  const blocks: ReactNode[] = [];
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const headingPattern = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
  const listPattern = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/;
  const isThematicBreak = (line: string) => /^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line);
  const splitTableRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim().replace(/\\\|/g, '|'));
  const isTableSeparator = (line: string) => splitTableRow(line).length > 0
    && splitTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
  const isBlockStart = (index: number) => {
    const line = lines[index] ?? '';
    return headingPattern.test(line)
      || /^ {0,3}(```+|~~~+)/.test(line)
      || /^ {0,3}>/.test(line)
      || isThematicBreak(line)
      || listPattern.test(line)
      || (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1]));
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const heading = line.match(headingPattern);
    if (heading) {
      const level = heading[1].length;
      const content = renderInlinePolicyMarkdown(heading[2], `heading-${blocks.length}`);
      const key = `heading-${blocks.length}`;
      if (level === 1) blocks.push(<h1 key={key}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key}>{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={key}>{content}</h3>);
      else if (level === 4) blocks.push(<h4 key={key}>{content}</h4>);
      else if (level === 5) blocks.push(<h5 key={key}>{content}</h5>);
      else blocks.push(<h6 key={key}>{content}</h6>);
      index += 1;
      continue;
    }

    const fence = line.match(/^ {0,3}(```+|~~~+)\s*([\w-]*)\s*$/);
    if (fence) {
      const fenceMarker = fence[1];
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !new RegExp(`^ {0,3}${fenceMarker[0]}{${fenceMarker.length},}\\s*$`).test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-block-${blocks.length}`}>
          <code className={fence[2] ? `language-${fence[2]}` : undefined}>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (/^ {0,3}>/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^ {0,3}>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${blocks.length}`}>{renderPolicyMarkdown(quoteLines.join('\n'))}</blockquote>);
      continue;
    }

    if (isThematicBreak(line)) {
      blocks.push(<hr key={`rule-${blocks.length}`} />);
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="studio-policy-markdown-table-scroll" key={`table-${blocks.length}`}>
          <table>
            <thead><tr>{headers.map((cell, cellIndex) => <th key={`header-${cellIndex}`}>{renderInlinePolicyMarkdown(cell, `table-head-${blocks.length}-${cellIndex}`)}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((_header, cellIndex) => <td key={`cell-${cellIndex}`}>{renderInlinePolicyMarkdown(row[cellIndex] ?? '', `table-cell-${blocks.length}-${rowIndex}-${cellIndex}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const firstListItem = line.match(listPattern);
    if (firstListItem) {
      const indent = firstListItem[1].length;
      const isOrdered = /^\d/.test(firstListItem[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const listItem = lines[index].match(listPattern);
        if (!listItem || listItem[1].length !== indent || /^\d/.test(listItem[2]) !== isOrdered) break;
        items.push(listItem[3]);
        index += 1;
      }
      const key = `list-${blocks.length}`;
      if (isOrdered) {
        const start = Number(firstListItem[2].match(/^\d+/)?.[0] ?? 1);
        blocks.push(<ol key={key} start={start}>{items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInlinePolicyMarkdown(item, `${key}-${itemIndex}`)}</li>)}</ol>);
      } else {
        blocks.push(<ul key={key}>{items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInlinePolicyMarkdown(item, `${key}-${itemIndex}`)}</li>)}</ul>);
      }
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() !== '' && !isBlockStart(index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    const paragraphKey = `paragraph-${blocks.length}`;
    blocks.push(<p key={paragraphKey}>{renderInlinePolicyMarkdown(paragraphLines.join(' '), paragraphKey)}</p>);
  }
  return blocks;
}

export function StatusCell({ severity, text }: { severity: Severity; text: string }) {
  return <StatusLabel severity={severity}>{text}</StatusLabel>;
}

export type OutcomeCounts = { passed: number; mutated: number; blocked: number; processed: number };
export type OutcomePercentages = { passed: number; mutated: number; blocked: number };

export function getOutcomeCounts(app: AppRecord): OutcomeCounts {
  return {
    passed: Math.max(0, app.processedRequests - app.mutatedRequests - app.blockedRequests),
    mutated: app.mutatedRequests,
    blocked: app.blockedRequests,
    processed: app.processedRequests,
  };
}

export function getOutcomePercentages(counts: OutcomeCounts): OutcomePercentages | null {
  if (counts.processed === 0) return null;

  const exactTenths = [counts.passed, counts.blocked, counts.mutated]
    .map((count) => (count / counts.processed) * 1000);
  const roundedTenths = exactTenths.map(Math.floor);
  const remainingTenths = 1000 - roundedTenths.reduce((sum, value) => sum + value, 0);
  const order = exactTenths
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((left, right) => right.remainder - left.remainder);

  for (let index = 0; index < remainingTenths; index += 1) {
    roundedTenths[order[index % order.length].index] += 1;
  }

  return { passed: roundedTenths[0] / 10, blocked: roundedTenths[1] / 10, mutated: roundedTenths[2] / 10 };
}

export function OutcomeMix({ app }: { app: AppRecord }) {
  const counts = getOutcomeCounts(app);
  const percentages = getOutcomePercentages(counts);

  if (!percentages) return <Content component="small" className="studio-muted">No requests</Content>;

  const outcomes: Array<{ label: string; count: number; percentage: number; color: 'green' | 'yellow' | 'red'; swatch: string }> = [
    { label: 'Passed', count: counts.passed, percentage: percentages.passed, color: 'green', swatch: 'passed' },
    { label: 'Mutated', count: counts.mutated, percentage: percentages.mutated, color: 'yellow', swatch: 'mutated' },
    { label: 'Blocked', count: counts.blocked, percentage: percentages.blocked, color: 'red', swatch: 'blocked' },
  ];

  const legend = (
    <div className="studio-outcome-tooltip">
      <Content component="small" className="studio-outcome-tooltip-heading">
        {app.name} · last 24 hours
      </Content>
      <ul aria-label="Absolute guardrail outcome counts">
        {outcomes.map((outcome) => (
          <li key={outcome.label}>
            <span className={`studio-outcome-swatch studio-outcome-swatch-${outcome.swatch}`} aria-hidden="true" />
            <span>{outcome.label}</span>
            <strong>{outcome.count.toLocaleString('en-US')}</strong>
          </li>
        ))}
        <li className="studio-outcome-total">
          <span>Total processed</span>
          <strong>{counts.processed.toLocaleString('en-US')}</strong>
        </li>
      </ul>
    </div>
  );

  return (
    <ul className="studio-outcome-pills" aria-label={`${app.name} guardrail outcome percentages`}>
      {outcomes.map((outcome) => (
        <li key={outcome.label}>
          <Tooltip content={legend} position="top">
            <span
              className="studio-outcome-pill-trigger"
              tabIndex={0}
              aria-label={`${outcome.label} ${outcome.percentage.toFixed(1)} percent; focus or hover for outcome counts`}
            >
              <Label color={outcome.color}>{outcome.percentage.toFixed(1)}%</Label>
            </span>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
