import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '../../components/navigation/Breadcrumbs';

describe('Breadcrumbs Component', () => {
  it('should render breadcrumb navigation with ARIA label', () => {
    render(
      <MemoryRouter initialEntries={['/incidents']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Incidents')).toBeInTheDocument();
  });

  it('should render custom labels when provided', () => {
    render(
      <MemoryRouter initialEntries={['/custom-route']}>
        <Breadcrumbs customLabels={{ 'custom-route': 'Custom Label' }} />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });
});
