import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotMarkdown } from '../components/CopilotMarkdown';
import { isSafeUrl } from '../utils/security';

describe('CopilotMarkdown', () => {
  it('isSafeUrl blocks dangerous XSS schemes', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
  });

  it('renders headings, tables, task lists, and citations', () => {
    const onCitationClick = vi.fn();
    const markdown = `
### Architecture Review
| Node | Status |
| --- | --- |
| Primary | Healthy |

- [x] Check pgbouncer logs
- [ ] Reboot replica

Refer to SOP [1].
    `.trim();

    render(<CopilotMarkdown content={markdown} onCitationClick={onCitationClick} />);

    expect(screen.getByText('Architecture Review')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Check pgbouncer logs')).toBeInTheDocument();
    expect(screen.getByText('Reboot replica')).toBeInTheDocument();

    const citationBtn = screen.getByText('[1]');
    fireEvent.click(citationBtn);
    expect(onCitationClick).toHaveBeenCalledWith(0);
  });

  it('renders mermaid placeholder card safely', () => {
    const markdown = '```mermaid\ngraph TD;\nA-->B;\n```';
    render(<CopilotMarkdown content={markdown} />);
    expect(screen.getByText(/Mermaid Architecture Diagram/i)).toBeInTheDocument();
    expect(screen.getByText(/A-->B;/i)).toBeInTheDocument();
  });
});
