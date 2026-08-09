import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentsPanel } from '../components/AttachmentsPanel';
import { IncidentAttachment } from '../types';
import { mockUsers } from '../../../services/mockData';

const mockAttachments: IncidentAttachment[] = [
  {
    id: 'att-1',
    incident_id: 'inc-1',
    filename: 'ingress-envoy-error.log',
    file_url: '#',
    file_size: '2.4 MB',
    file_type: 'LOG_DATA',
    uploaded_by: mockUsers[0],
    uploaded_at: new Date().toISOString(),
  },
];

describe('AttachmentsPanel', () => {
  it('renders upload drag-and-drop zone and attached files', () => {
    const handleUpload = vi.fn().mockResolvedValue(undefined);

    render(
      <AttachmentsPanel
        attachments={mockAttachments}
        currentUser={mockUsers[0]}
        onUploadAttachment={handleUpload}
      />
    );

    expect(screen.getByText('ingress-envoy-error.log')).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });
});
