import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Mail, Lock, Building } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import { Button } from '../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('ANALYST');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await registerAuth({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      organization_name: orgName,
      role: role as Role,
    });
    setIsLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-surface border border-zinc-800 rounded-2xl p-8 shadow-2xl z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Enterprise Workspace</h1>
          <p className="text-xs text-zinc-400 mt-1">Deploy Multi-Tenant AI Security Command</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="Jane"
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
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Organization Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="Acme Global Defense"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder="jane.doe@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Primary Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="ADMIN">ADMIN - Full Platform Management</option>
              <option value="ANALYST">ANALYST - Security Analyst & Triage</option>
              <option value="RESPONDER">RESPONDER - Incident Responder</option>
              <option value="VIEWER">VIEWER - Executive Read-Only</option>
            </select>
          </div>

          <Button type="submit" variant="ai" className="w-full py-2.5 mt-2" isLoading={isLoading}>
            <span>Initialize Organization</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
