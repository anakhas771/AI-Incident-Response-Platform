import React from 'react';
import { useParams } from 'react-router-dom';
import { IncidentWorkspaceLayout } from '../features/incidents';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || 'INC-8902-771';

  return <IncidentWorkspaceLayout incidentId={incidentId} />;
};

export default IncidentDetailPage;
