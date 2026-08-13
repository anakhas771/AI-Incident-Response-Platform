import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveKpiCards } from '../components/ExecutiveKpiCards';
import { ExecutiveKPIMetrics } from '../types';

describe('ExecutiveKpiCards Component', () => {
  const sampleKpis: ExecutiveKPIMetrics = {
    incidentCount: 12,
    openIncidents: 3,
    resolvedIncidents: 9,
    mttrMinutes: 18.5,
    mttrTrendPct: -14,
    mttdMinutes: 2.3,
    mttdTrendPct: -8,
    slaCompliancePct: 99.4,
    slaTrendPct: 0.2,
  };

  it('renders all KPI card titles and ARIA labels', () => {
    render(<ExecutiveKpiCards kpis={sampleKpis} />);

    expect(screen.getByText('Total Incidents')).toBeInTheDocument();
    expect(screen.getByText('Open Incidents')).toBeInTheDocument();
    expect(screen.getByText('Resolved Incidents')).toBeInTheDocument();
    expect(screen.getByText('MTTR (Resolution)')).toBeInTheDocument();
    expect(screen.getByText('MTTD (Detection)')).toBeInTheDocument();
    expect(screen.getByText('SLA Compliance')).toBeInTheDocument();

    expect(screen.getByLabelText('Executive KPI Metrics')).toBeInTheDocument();
  });

  it('renders nothing when isLoading is true', () => {
    const { container } = render(<ExecutiveKpiCards kpis={sampleKpis} isLoading={true} />);
    expect(container).toBeEmptyDOMElement();
  });
});
