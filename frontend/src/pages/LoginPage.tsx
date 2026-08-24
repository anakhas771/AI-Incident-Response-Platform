import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Lock, Mail, CheckCircle2, KeyRound } from 'lucide-react';

import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const registeredMessage = (location.state as { registeredMessage?: string } | null)
    ?.registeredMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email.trim().toLowerCase(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid email or password');
      return;
    }

    navigate('/');
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@incident.ai';
    const demoPassword = 'Demo@123456';

    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsLoading(true);

    const result = await login(demoEmail, demoPassword);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to authenticate with demo account.');
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 relative overflow-y-auto overflow-x-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute -top-20 -left-20 sm:top-1/4 sm:left-1/4 w-56 h-56 sm:w-96 sm:h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 sm:bottom-1/4 sm:right-1/4 w-56 h-56 sm:w-96 sm:h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-surface border border-zinc-800 rounded-2xl p-5 sm:p-7 md:p-8 shadow-2xl z-10 relative my-auto"
      >
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2 flex-wrap">
            Enterprise SOC Login
            <span className="text-[10px] sm:text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-1.5 py-0.5 rounded">
              v2.4
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">
            AI Incident Response & Automated Security Command
          </p>
        </div>

        {registeredMessage && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 sm:px-4 py-3 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{registeredMessage}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 sm:px-4 py-3 text-xs text-rose-300 flex items-start gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-zinc-900 border border-indigo-500/30">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Demo Account</span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700/50">
              ADMIN
            </span>
          </div>
          <div className="text-[11px] sm:text-xs font-mono text-zinc-400 space-y-1 mb-3 break-all">
            <div>
              <span className="text-zinc-500">Email:</span> demo@incident.ai
            </div>
            <div>
              <span className="text-zinc-500">Password:</span> Demo@123456
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full min-h-10 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <span>Login as Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
                autoComplete="email"
                className="w-full min-h-11 bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
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
                autoComplete="current-password"
                className="w-full min-h-11 bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>Hardware Token (FIDO2 / WebAuthn) Enabled</span>
          </div>

          <Button type="submit" variant="ai" className="w-full min-h-11 py-2.5" isLoading={isLoading}>
            <span>Sign In to Platform</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-5 sm:mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400 leading-relaxed">
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
