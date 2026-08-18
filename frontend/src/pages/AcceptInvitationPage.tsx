import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Users, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import authApi, { InvitationPreview } from '../api/authApi';
import { useAuthStore } from '../stores/useAuthStore';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, user, restoreSession } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      setLoading(false);
      return;
    }

    let mounted = true;
    authApi
      .previewInvitation(token)
      .then((data) => {
        if (mounted) setInvitation(data);
      })
      .catch((err) => {
        const response = err as { response?: { data?: { detail?: string } } };
        if (mounted) setError(response.response?.data?.detail || 'This invitation is invalid or expired.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const goToRegister = () => {
    if (!token) return;
    sessionStorage.setItem('pending_invitation_token', token);
    navigate(`/register?invitation_token=${encodeURIComponent(token)}`);
  };

  const goToLogin = () => {
    if (!token) return;
    sessionStorage.setItem('pending_invitation_token', token);
    navigate(`/login?invitation_token=${encodeURIComponent(token)}`);
  };

  const handleAccept = async () => {
    if (!token || !invitation) return;

    if (!isAuthenticated) {
      goToRegister();
      return;
    }

    if (user?.email?.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) {
      setError(
        `You are signed in as ${user?.email || 'another account'}, but this invitation is for ${invitation.email}. Sign out and sign in with the invited email.`
      );
      return;
    }

    setAccepting(true);
    setError('');
    try {
      await authApi.acceptInvitation(token);
      await restoreSession();
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      const response = err as { response?: { data?: { detail?: string; token?: string[] } } };
      setError(
        response.response?.data?.detail ||
          response.response?.data?.token?.[0] ||
          'Unable to accept this invitation.'
      );
    } finally {
      setAccepting(false);
    }
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
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
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
            Review the invitation and accept it to join the organization.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-zinc-500">Validating invitation...</div>
        ) : error && !invitation ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Return to Platform
            </Button>
          </div>
        ) : success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-200 font-medium">Invitation Accepted</p>
            <p className="text-xs text-zinc-400">You’ve joined the organization. Redirecting…</p>
          </div>
        ) : invitation ? (
          <>
            <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Organization</p>
                <p className="mt-1 text-base font-semibold text-zinc-100">{invitation.organization_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-300" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Invited email</p>
                  <p className="truncate text-sm font-medium text-zinc-200">{invitation.email}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">Role</p>
                <p className="mt-1 text-sm font-medium text-zinc-200">{invitation.role}</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
                {error}
              </div>
            )}

            {isAuthenticated ? (
              user?.email?.trim().toLowerCase() === invitation.email.trim().toLowerCase() ? (
                <Button onClick={handleAccept} variant="ai" className="mt-6 w-full py-3" disabled={accepting}>
                  {accepting ? 'Joining organization…' : 'Accept Invitation & Join'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-xs text-rose-200">
                    This invitation is for <strong>{invitation.email}</strong>. You are currently signed in as{' '}
                    <strong>{user?.email || 'another account'}</strong>.
                  </p>
                  <Button variant="outline" onClick={() => useAuthStore.getState().logout()} className="w-full">
                    Sign Out
                  </Button>
                  <Button variant="ai" onClick={goToLogin} className="w-full">
                    Sign In as {invitation.email}
                  </Button>
                </div>
              )
            ) : (
              <div className="mt-6 space-y-3">
                <Button onClick={handleAccept} variant="ai" className="w-full py-3">
                  Accept Invitation & Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button onClick={goToLogin} variant="outline" className="w-full">
                  Already have an account? Sign In
                </Button>
                <p className="text-center text-[11px] leading-5 text-zinc-600">
                  New invitees continue to account setup with this invitation securely attached.
                </p>
              </div>
            )}
          </>
        ) : null}
      </motion.div>
    </div>
  );
};

export default AcceptInvitationPage;
