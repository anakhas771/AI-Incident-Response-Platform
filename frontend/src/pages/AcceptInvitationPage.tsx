import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authApi from '../api/authApi';
import { useAuthStore } from '../stores/useAuthStore';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, restoreSession } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('pending_invitation_token', token);
      navigate(`/register?invitation_token=${encodeURIComponent(token)}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.acceptInvitation(token);
      await restoreSession();
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; token?: string[] } } };
      setError(
        error.response?.data?.detail || error.response?.data?.token?.[0] || 'An error occurred while accepting the invitation.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!token) return;
    sessionStorage.setItem('pending_invitation_token', token);
    navigate(`/register?invitation_token=${encodeURIComponent(token)}`);
  };

  const handleLogin = () => {
    if (!token) return;
    sessionStorage.setItem('pending_invitation_token', token);
    navigate(`/login?invitation_token=${encodeURIComponent(token)}`);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center text-zinc-100">
          <p>Invalid or missing invitation token.</p>
          <Link to="/" className="text-indigo-400 mt-4 inline-block hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-zinc-100 select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-400/[0.08] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-surface/95 border border-indigo-500/20 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20 z-10 relative backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Users className="w-7 h-7" />
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
            <ShieldCheck className="h-3 w-3" /> Secure Invitation
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">You’re Invited</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-6">
            You have been invited to join an organization on the AI Incident Response Platform.
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-200 font-medium">Invitation Accepted</p>
            <p className="text-xs text-zinc-400">You’ve joined the organization. Redirecting…</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-4">
            <Button
              onClick={handleAccept}
              variant="ai"
              className="w-full py-3"
              disabled={loading}
            >
              {loading ? 'Joining organization…' : 'Accept Invitation & Join'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="w-full py-2.5 text-zinc-400"
            >
              Decline
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button onClick={handleAccept} variant="ai" className="w-full py-3">
              Accept Invitation & Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-3 text-[10px] uppercase tracking-[0.14em] text-zinc-600">Already have an account?</span>
              </div>
            </div>

            <Button onClick={handleLogin} variant="outline" className="w-full py-2.5">
              Sign In to Accept
            </Button>

            <p className="text-center text-[11px] leading-5 text-zinc-600">
              New users will finish account setup after accepting. Your invitation will be applied automatically.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AcceptInvitationPage;
