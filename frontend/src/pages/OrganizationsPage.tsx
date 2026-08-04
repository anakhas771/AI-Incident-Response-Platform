import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { mockOrganization } from '../services/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const OrganizationsPage: React.FC = () => {
  const { organization } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" /> Multi-Tenant Organizations
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Enterprise isolation boundaries & workspace configurations
          </p>
        </div>

        <Button variant="default" size="sm">
          <Plus className="w-4 h-4" /> Create Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect={false} className="border-indigo-900/50 bg-surface-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-subtle">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-100">
                {organization?.name || mockOrganization.name}
              </CardTitle>
              <CardDescription className="font-mono text-xs text-indigo-400">
                {organization?.slug || mockOrganization.slug}
              </CardDescription>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ACTIVE WORKSPACE
            </span>
          </CardHeader>
          <div className="p-4 space-y-3 text-xs">
            <p className="text-zinc-300">
              {organization?.description || mockOrganization.description}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-subtle font-mono text-zinc-400">
              <span>Members: 42 users</span>
              <span>Quota Tier: Enterprise SOC</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationsPage;
