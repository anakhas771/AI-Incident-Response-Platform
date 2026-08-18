import React, { useState } from 'react';
import { Building2, Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { mockOrganization } from '../services/mockData';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const OrganizationsPage: React.FC = () => {
  const { organization, createOrganization } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createOrganization({ name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      toast.success('Organization created and selected as your active workspace.');
    } catch (error: any) {
      toast.error(String(error?.response?.data?.name?.[0] || error?.response?.data?.detail || 'Unable to create organization.'));
    } finally {
      setIsCreating(false);
    }
  };

  const active = organization || mockOrganization;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100"><Building2 className="h-5 w-5 text-indigo-400" /> Multi-Tenant Organizations</h1>
          <p className="mt-1 text-xs text-zinc-400">Create and manage secure enterprise workspace boundaries.</p>
        </div>
        <Button variant="ai" size="sm" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4" /> Create Organization</Button>
      </div>

      <Card hoverEffect={false} className="overflow-hidden border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-cyan-400/[0.04]">
        <CardHeader className="flex flex-col justify-between gap-4 border-b border-subtle pb-4 sm:flex-row sm:items-center">
          <div><CardTitle className="text-sm font-semibold text-zinc-100">{active.name}</CardTitle><CardDescription className="font-mono text-xs text-indigo-400">{active.slug}</CardDescription></div>
          <span className="rounded-full border border-emerald-800 bg-emerald-950 px-2 py-1 text-[10px] font-mono font-bold text-emerald-400">ACTIVE WORKSPACE</span>
        </CardHeader>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-2"><p className="text-sm leading-6 text-zinc-300">{active.description || 'Enterprise incident response workspace.'}</p><div className="mt-4 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/15 bg-indigo-400/[0.05] px-2.5 py-1 text-[10px] text-indigo-300"><Sparkles className="h-3 w-3" /> AI-ready workspace</span><span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[10px] text-zinc-400">Multi-tenant isolation</span></div></div>
          <div className="rounded-lg border border-subtle bg-zinc-950/30 p-4 text-xs"><div className="flex items-center justify-between py-1"><span className="text-zinc-500">Members</span><span className="font-mono text-zinc-200">{active.users_count ?? '—'}</span></div><div className="mt-2 flex items-center justify-between border-t border-subtle pt-3"><span className="text-zinc-500">Status</span><span className="text-emerald-400">{active.is_active ? 'Operational' : 'Inactive'}</span></div></div>
        </div>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Organization" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Organization Name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Security Operations" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Description</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe this incident response workspace…" className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs leading-5 text-zinc-100 outline-none focus:border-indigo-500" /></label>
          <div className="flex justify-end gap-3 border-t border-subtle pt-4"><Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" variant="ai" disabled={isCreating}>{isCreating ? 'Creating…' : 'Create Workspace'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationsPage;
