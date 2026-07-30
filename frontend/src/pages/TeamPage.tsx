import React, { useState } from 'react';
import { Users, UserPlus, MoreVertical } from 'lucide-react';
import { mockUsers } from '../services/mockData';
import { RoleBadge } from '../components/ui/Badge';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const TeamPage: React.FC = () => {
  const [team, setTeam] = useState(mockUsers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ANALYST' | 'RESPONDER' | 'VIEWER'>('ANALYST');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const newUser = {
      id: 'user-' + Date.now(),
      email,
      first_name: email.split('@')[0],
      last_name: '',
      full_name: email.split('@')[0],
      role,
      is_active: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };
    setTeam((prev) => [...prev, newUser]);
    setIsInviteOpen(false);
    setEmail('');
    toast.success(`Invite sent to ${email}`, {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Team & RBAC Management
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage organization members, roles, and access control permissions</p>
        </div>

        <Button variant="default" size="sm" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      <div className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-surface-elevated text-zinc-400 font-mono text-[11px] uppercase tracking-wider border-b border-subtle">
            <tr>
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {team.map((m) => (
              <tr key={m.id} className="hover:bg-surface-elevated/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img src={m.avatar} alt={m.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div>
                      <h4 className="font-semibold text-zinc-100">{m.full_name}</h4>
                      <p className="text-[11px] font-mono text-zinc-400">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <RoleBadge role={m.role} />
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-zinc-400">
                  {m.date_joined ? new Date(m.date_joined).toLocaleDateString() : '2025-02-01'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="p-1 rounded text-zinc-500 hover:text-zinc-200">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member" maxWidth="md">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operator@company.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ADMIN">ADMIN - Full Control</option>
              <option value="ANALYST">ANALYST - Triage & RCA</option>
              <option value="RESPONDER">RESPONDER - Incident Response</option>
              <option value="VIEWER">VIEWER - Executive View</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="ai">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamPage;
