import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { IncidentWorkspaceLayout } from '../features/incidents';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/incidents" replace />;
  }

  return <IncidentWorkspaceLayout incidentId={id} />;
};

export default IncidentDetailPage;
