import React, { useState } from 'react';
import { User as UserIcon, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { RoleBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, organization } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.first_name || 'Alex');
  const [lastName, setLastName] = useState(user?.last_name || 'Chen');
  const [phone, setPhone] = useState(user?.phone_number || '+1 (555) 234-5678');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile details updated successfully', {
      style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-400" /> User Profile & Security Credentials
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage personal account details and multi-factor authentication
        </p>
      </div>

      <Card hoverEffect={false}>
        <div className="flex items-center gap-4 pb-6 border-b border-subtle">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={user?.full_name}
            className="w-16 h-16 rounded-full border-2 border-indigo-500/40 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100">{user?.full_name}</h2>
              {user?.role && <RoleBadge role={user.role} />}
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">{user?.email}</p>
            <p className="text-xs text-indigo-400 font-mono mt-1">{organization?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="ai" size="sm">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
