import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authApi from '../api/authApi';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.confirmPasswordReset({
        token,
        new_password: password,
        new_password_confirm: passwordConfirm,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; new_password?: string[] } } };
      setError(
        error.response?.data?.detail ||
          error.response?.data?.new_password?.[0] ||
          'An error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token && !submitted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center text-zinc-100">
          <p>Invalid or missing reset token.</p>
          <Link to="/login" className="text-indigo-400 mt-4 inline-block hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-surface border border-zinc-800 rounded-2xl p-8 shadow-2xl z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Set New Password</h1>
          <p className="text-xs text-zinc-400 mt-1">Please enter your new password below</p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-200 font-medium">Password Reset Successful</p>
            <p className="text-xs text-zinc-400">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" variant="ai" className="w-full py-2.5" disabled={loading}>
              {loading ? 'Saving...' : 'Reset Password'}
            </Button>

            {error && <div className="text-center text-red-500 text-xs mt-2">{error}</div>}

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
