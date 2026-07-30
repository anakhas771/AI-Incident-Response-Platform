import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Cpu, Sparkles, Activity } from 'lucide-react';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 2200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center text-zinc-100 z-50 select-none">
      <div className="relative flex flex-col items-center">
        {/* Glow Halo */}
        <div className="absolute w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 mb-6"
        >
          <ShieldAlert className="w-8 h-8" />
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold tracking-tight text-white flex items-center gap-2"
        >
          ANTIGRAVITY{' '}
          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-1.5 py-0.5 rounded">
            AI SOC
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-xs font-mono text-zinc-400 mt-2"
        >
          Initializing Enterprise AI Incident Response Platform...
        </motion.p>

        {/* System Telemetry Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-4 mt-8 text-[11px] font-mono text-zinc-400"
        >
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> K8s Mesh Online
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Copilot Ready
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> 100% Operational
          </span>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-zinc-900 rounded-full mt-6 overflow-hidden border border-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          />
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
