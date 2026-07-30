import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { mockUsers } from '../services/mockData';
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('alex.chen@acme-security.io');
  const [password, setPassword] = useState('SuperSecretPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
    navigate('/');
  };

  const selectDemoUser = (userEmail: string) => {
    setEmail(userEmail);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-surface border border-zinc-800 rounded-2xl p-8 shadow-2xl z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Enterprise SOC Login{' '}
            <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            AI Incident Response & Automated Security Command
          </p>
        </div>

        <div className="mb-6 p-3 rounded-xl bg-surface-elevated border border-zinc-800/80">
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            1-Click Demo Persona Switcher:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {mockUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectDemoUser(u.email)}
                className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  email.toLowerCase() === u.email.toLowerCase()
                    ? 'bg-indigo-950/80 border-indigo-600/60 text-indigo-200'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{u.first_name}</span>
                <span className="text-[10px] opacity-75">{u.role}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Hardware Token (FIDO2 / WebAuthn) Enabled</span>
          </div>

          <Button type="submit" variant="ai" className="w-full py-2.5" isLoading={isLoading}>
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          Need an enterprise workspace?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Register Organization
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
