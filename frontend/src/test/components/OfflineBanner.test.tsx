import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../../components/ui/OfflineBanner';

describe('OfflineBanner Component', () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    });
  });

  it('does not render when network is online', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    render(<OfflineBanner />);
    expect(screen.queryByText(/Offline Mode Active/i)).toBeNull();
  });

  it('renders offline warning banner when network connection drops', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    render(<OfflineBanner />);
    expect(screen.getByText(/Offline Mode Active/i)).toBeDefined();
    expect(screen.getByText('QUEUED')).toBeDefined();
  });
});
