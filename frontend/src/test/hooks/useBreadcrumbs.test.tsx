import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

describe('useBreadcrumbs', () => {
  it('should generate Platform root item on "/" path', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useBreadcrumbs(), { wrapper });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].label).toBe('Platform');
    expect(result.current[0].isCurrent).toBe(true);
  });

  it('should generate breadcrumbs for nested routes like "/incidents/inc-101"', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/incidents/inc-101']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useBreadcrumbs(), { wrapper });
    expect(result.current).toHaveLength(3);
    expect(result.current[0].label).toBe('Platform');
    expect(result.current[1].label).toBe('Incidents');
    expect(result.current[1].path).toBe('/incidents');
    expect(result.current[2].label).toBe('INC-101');
    expect(result.current[2].isCurrent).toBe(true);
  });
});
