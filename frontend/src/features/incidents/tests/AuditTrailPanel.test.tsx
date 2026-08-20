import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuditTrailPanel } from '../components/AuditTrailPanel';
import { IncidentAuditLog } from '../types';
import { mockUsers } from '../../../services/mockData';

const mockAudit: IncidentAuditLog[] = [
  {
    id: 'audit-1',
    incident_id: 'inc-1',
    timestamp: new Date().toISOString(),
    action_type: 'STATUS_CHANGE',
    description: 'Status changed from OPEN to INVESTIGATING',
    actor: mockUsers[0],
    old_value: 'OPEN',
    new_value: 'INVESTIGATING',
  },
];

describe('AuditTrailPanel', () => {
  it('renders guaranteed audit trail log fields', () => {
    render(<AuditTrailPanel auditTrail={mockAudit} />);

    expect(screen.getByText('Immutable Security Audit Trail (1)')).toBeInTheDocument();
    expect(screen.getByText('STATUS_CHANGE')).toBeInTheDocument();
    expect(screen.getByText('Status changed from OPEN to INVESTIGATING')).toBeInTheDocument();
  });
});
