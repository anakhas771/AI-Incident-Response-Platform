import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownRenderer, isSafeUrl } from '../../components/chat/MarkdownRenderer';

describe('MarkdownRenderer Security & XSS Prevention', () => {
  describe('isSafeUrl validation', () => {
    it('returns true for safe https protocols', () => {
      expect(isSafeUrl('https://security.company.com/incident-29')).toBe(true);
      expect(isSafeUrl('http://localhost:3000/docs')).toBe(true);
      expect(isSafeUrl('/knowledge/DOC-102')).toBe(true);
    });

    it('returns false for dangerous javascript: and data: XSS vectors', () => {
      expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox("xss")')).toBe(false);
      expect(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });
  });

  describe('MarkdownRenderer link and citation rendering', () => {
    it('renders safe markdown links with target="_blank" and rel="noopener noreferrer"', () => {
      render(
        <MarkdownRenderer content="Check the [Security Runbook](https://runbook.soc.local/runbook-v2) for details." />
      );

      const link = screen.getByText('Security Runbook');
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('https://runbook.soc.local/runbook-v2');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('neutralizes unsafe javascript: links by rendering [Blocked Link]', () => {
      render(
        <MarkdownRenderer content="Click [Malicious Payload](javascript:alert(1)) to execute script." />
      );

      expect(screen.queryByRole('link', { name: 'Malicious Payload' })).toBeNull();
      expect(screen.getByText('[Blocked Link: Malicious Payload]')).toBeDefined();
    });

    it('invokes onCitationClick callback with correct 0-based index when [N] is clicked', () => {
      const handleCitationClick = vi.fn();
      render(
        <MarkdownRenderer
          content="The incident originated from IP 192.168.1.100 [1] and was blocked [2]."
          onCitationClick={handleCitationClick}
        />
      );

      const btn1 = screen.getByText('[1]');
      const btn2 = screen.getByText('[2]');

      fireEvent.click(btn1);
      expect(handleCitationClick).toHaveBeenCalledWith(0);

      fireEvent.click(btn2);
      expect(handleCitationClick).toHaveBeenCalledWith(1);
    });
  });
});
