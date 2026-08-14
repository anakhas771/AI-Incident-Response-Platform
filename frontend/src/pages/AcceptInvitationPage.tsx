import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
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

  useEffect(() => {
    // If not authenticated, they need to sign up or log in first?
    // Wait, the prompt implies they can accept while logged in, or if they need to register.
    // If not logged in, we should redirect to register with token in URL.
    if (!isAuthenticated && token) {
      navigate(`/register?invitation_token=${token}`);
    }
  }, [isAuthenticated, token, navigate]);

  const handleAccept = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await authApi.acceptInvitation(token);
      await restoreSession();
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; token?: string[] } } };
      setError(
        error.response?.data?.detail || error.response?.data?.token?.[0] || 'An error occurred.'
      );
    } finally {
      setLoading(false);
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
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-surface border border-zinc-800 rounded-2xl p-8 shadow-2xl z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Organization Invitation</h1>
          <p className="text-xs text-zinc-400 mt-1">
            You have been invited to join an organization
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-zinc-200 font-medium">Invitation Accepted</p>
            <p className="text-xs text-zinc-400">Redirecting you to your dashboard...</p>
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
        ) : (
          <div className="space-y-4">
            <Button
              onClick={handleAccept}
              variant="ai"
              className="w-full py-2.5"
              disabled={loading}
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="w-full py-2.5 text-zinc-400"
            >
              Decline
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AcceptInvitationPage;
