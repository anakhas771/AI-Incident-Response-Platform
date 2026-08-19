import React, { useRef, useState } from 'react';
import { Camera, Save, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { RoleBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const fallbackAvatar =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

export const ProfilePage: React.FC = () => {
  const { user, organization, updateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || fallbackAvatar);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile images must be 5 MB or smaller.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('first_name', firstName);
      payload.append('last_name', lastName);
      payload.append('phone_number', phone);
      if (selectedFile) payload.append('avatar', selectedFile);
      const updated = await updateProfile(payload);
      setPreviewUrl(updated.avatar || fallbackAvatar);
      setSelectedFile(null);
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-100">
          <UserIcon className="h-5 w-5 text-indigo-400" />
          User Profile & Security
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Manage identity, profile image, and account details.
        </p>
      </div>

      <Card
        hoverEffect={false}
        className="overflow-hidden border-indigo-500/10 bg-gradient-to-br from-indigo-500/[0.07] via-surface to-cyan-400/[0.04]"
      >
        <div className="flex flex-col gap-5 border-b border-subtle pb-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <img
              src={previewUrl}
              alt={user?.full_name || 'Operator'}
              className="h-20 w-20 rounded-2xl border border-indigo-400/30 object-cover shadow-xl shadow-indigo-950/20"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-200 shadow-lg transition hover:bg-indigo-500 hover:text-white"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100">{user?.full_name || 'Operator'}</h2>
              {user?.role && <RoleBadge role={user.role} />}
            </div>
            <p className="mt-1 truncate text-xs font-mono text-zinc-400">{user?.email}</p>
            <p className="mt-1 text-xs text-indigo-400">
              {organization?.name || 'No organization assigned'}
            </p>
            <p className="mt-2 text-[11px] text-zinc-500">PNG, JPG or WebP · maximum 5 MB</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                First Name
              </span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Last Name
              </span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Phone Number
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition focus:border-indigo-500"
            />
          </label>

          <div className="flex justify-end border-t border-subtle pt-4">
            <Button type="submit" variant="ai" size="sm" disabled={isSaving}>
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
