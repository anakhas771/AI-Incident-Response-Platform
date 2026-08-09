import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { IncidentWorkspaceLayout } from '../components/layout/IncidentWorkspaceLayout';

describe('IncidentWorkspaceLayout', () => {
  it('renders multi-panel incident command center layout', async () => {
    render(
      <BrowserRouter>
        <IncidentWorkspaceLayout incidentId="INC-8902-771" />
      </BrowserRouter>
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Back to Incidents Queue')).toBeInTheDocument();
  });
});
