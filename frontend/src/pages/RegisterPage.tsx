import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, Building, User as UserIcon, ShieldAlert } from 'lucide-react';

import { useAuthStore } from '../stores/useAuthStore';
import { Role } from '../types';
import { Button } from '../components/ui/Button';
import transactLogo from '../assets/brand/transact-logo.svg';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<Role>('ANALYST');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation_token') || '';

  const { register: registerAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!confirmPassword) {
      setError('Confirm password is required.');
      setFieldErrors({ password_confirm: 'password_confirm required' });
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setFieldErrors({ password_confirm: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);

    const result = await registerAuth({
      email: email.trim().toLowerCase(),
      password,
      password_confirm: confirmPassword,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      organization_name: invitationToken ? undefined : orgName.trim() || undefined,
      role,
      invitation_token: invitationToken || undefined,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Account creation failed. Please check your inputs.');
      setFieldErrors(result.fieldErrors || {});
      return;
    }

    navigate('/login', {
      state: {
        registeredMessage: invitationToken
          ? 'Account created successfully. Your organization invitation has been applied. Please sign in.'
          : 'Account created successfully! Please sign in with your credentials.',
      },
    });
  };

  const getFieldErrorText = (field: string): string | null => {
    const val = fieldErrors[field];
    if (!val) return null;
    return Array.isArray(val) ? val.join(' ') : val;
  };

  const fieldClass = (field: string, extra = '') =>
    `w-full min-h-11 bg-zinc-950 border rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none ${
      getFieldErrorText(field)
        ? 'border-rose-500 focus:border-rose-500'
        : 'border-zinc-800 focus:border-indigo-500'
    } ${extra}`;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 relative overflow-y-auto overflow-x-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl bg-surface border border-zinc-800 rounded-2xl p-5 sm:p-7 md:p-8 shadow-2xl z-10 relative my-auto"
      >
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/10 mb-3">
            <img src={transactLogo} alt="OpsMind logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {invitationToken ? 'Join Your Organization' : 'Create Enterprise Workspace'}
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed max-w-md">
            {invitationToken
              ? 'Complete your account setup to join the invited organization.'
              : 'Deploy Multi-Tenant AI Security Command'}
          </p>
        </div>

        {invitationToken && (
          <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 sm:px-4 py-3 text-xs text-indigo-200 leading-relaxed">
            You are registering through an organization invitation. Use the exact email address that
            received the invitation.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 sm:px-4 py-3 text-xs text-rose-300 flex items-start gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">First Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" className={fieldClass('first_name', 'pl-10')} placeholder="Jane" />
              </div>
              {getFieldErrorText('first_name') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('first_name')}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Last Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" className={fieldClass('last_name', 'pl-10')} placeholder="Doe" />
              </div>
              {getFieldErrorText('last_name') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('last_name')}</p>}
            </div>
          </div>

          {!invitationToken && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Organization Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} autoComplete="organization" className={fieldClass('organization_name', 'pl-10')} placeholder="Acme Global Defense" />
              </div>
              {getFieldErrorText('organization_name') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('organization_name')}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={fieldClass('email', 'pl-10')} placeholder="jane.doe@company.com" />
            </div>
            {getFieldErrorText('email') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('email')}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className={fieldClass('password', 'pl-10 font-mono')} placeholder="••••••••••••" />
              </div>
              {getFieldErrorText('password') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('password')}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={fieldClass('password_confirm', 'pl-10 font-mono')} placeholder="Repeat password" />
              </div>
              {getFieldErrorText('password_confirm') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('password_confirm')}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Primary Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={fieldClass('role')}>
              <option value="ADMIN">ADMIN - Full Platform Management</option>
              <option value="ANALYST">ANALYST - Security Analyst & Triage</option>
              <option value="RESPONDER">RESPONDER - Incident Responder</option>
              <option value="VIEWER">VIEWER - Executive Read-Only</option>
            </select>
            {getFieldErrorText('role') && <p className="text-[11px] text-rose-400 mt-1 font-mono">{getFieldErrorText('role')}</p>}
          </div>

          <Button type="submit" variant="ai" className="w-full min-h-11 py-2.5 mt-2" isLoading={isLoading}>
            <span>{invitationToken ? 'Join Organization' : 'Initialize Organization'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-5 sm:mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400 leading-relaxed">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
