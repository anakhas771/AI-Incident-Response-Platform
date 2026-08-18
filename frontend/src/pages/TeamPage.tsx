import React, { useState } from 'react';
import { Users, UserPlus, MoreVertical } from 'lucide-react';
import { mockUsers } from '../services/mockData';
import { RoleBadge } from '../components/ui/Badge';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState(mockUsers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ANALYST');
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || isSending) return;
    setIsSending(true);
    try {
      await authApi.sendInvitation({ email: normalizedEmail, role });
      const newUser = {
        id: `pending-${Date.now()}`,
        email: normalizedEmail,
        first_name: normalizedEmail.split('@')[0],
        last_name: '',
        full_name: normalizedEmail.split('@')[0],
        role,
        is_active: false,
        avatar: undefined,
      };
      setTeam((prev) => [...prev, newUser]);
      setIsInviteOpen(false);
      setEmail('');
      toast.success(`Invitation sent to ${normalizedEmail}`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Unable to send invitation. Check your organization permissions and email settings.';
      toast.error(String(detail));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100">
            <Users className="h-5 w-5 text-indigo-400" /> Team & RBAC Management
          </h1>
          <p className="mt-1 text-xs text-zinc-400">Manage organization members, roles, and secure email invitations.</p>
        </div>
        <Button variant="default" size="sm" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-subtle bg-surface shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs text-zinc-300">
            <thead className="border-b border-subtle bg-surface-elevated text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <tr><th className="px-4 py-3">Member Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined Date</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {team.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-surface-elevated/50">
                  <td className="px-4 py-3.5"><div className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">{member.first_name.charAt(0).toUpperCase()}</div><div><h4 className="font-semibold text-zinc-100">{member.full_name}</h4><p className="text-[11px] font-mono text-zinc-400">{member.email}</p></div></div></td>
                  <td className="px-4 py-3.5"><RoleBadge role={member.role} /></td>
                  <td className="px-4 py-3.5"><span className={member.is_active ? 'inline-flex items-center gap-1.5 rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400' : 'inline-flex items-center gap-1.5 rounded border border-amber-800 bg-amber-950 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-400'}><span className={member.is_active ? 'h-1.5 w-1.5 rounded-full bg-emerald-500' : 'h-1.5 w-1.5 rounded-full bg-amber-500'} />{member.is_active ? 'Active' : 'Invitation pending'}</span></td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">{member.date_joined ? new Date(member.date_joined).toLocaleDateString() : 'Pending'}</td>
                  <td className="px-4 py-3.5 text-right"><button className="rounded p-1 text-zinc-500 hover:text-zinc-200" aria-label={`Actions for ${member.full_name}`}><MoreVertical className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member" maxWidth="md">
        <form onSubmit={handleInvite} className="space-y-4">
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Work Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="operator@company.com" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">Assigned Role</span><select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-100 outline-none focus:border-indigo-500"><option value="ADMIN">ADMIN - Full Control</option><option value="ANALYST">ANALYST - Triage & RCA</option><option value="RESPONDER">RESPONDER - Incident Response</option><option value="VIEWER">VIEWER - Executive View</option></select></label>
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4"><Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button><Button type="submit" variant="ai" disabled={isSending}>{isSending ? 'Sending…' : 'Send Invitation'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamPage;
