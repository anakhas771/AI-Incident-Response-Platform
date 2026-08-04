import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Lock, Award, CheckCircle2, Cpu } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const trustBadges = [
    { label: 'SOC 2 Type II Certified', icon: ShieldCheck },
    { label: 'ISO 27001 Compliant', icon: Award },
    { label: '256-Bit AES Encryption', icon: Lock },
    { label: 'Zero-Trust Architecture', icon: Cpu },
  ];

  return (
    <div className="min-h-screen w-full bg-background flex flex-col lg:flex-row overflow-x-hidden font-sans antialiased text-zinc-100">
      {/* Left Column: Branded Hero & Enterprise Security Operations Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/70 p-12 flex-col justify-between relative overflow-hidden border-r border-subtle">
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

        {/* Top: Logo & Title */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-zinc-100 flex items-center gap-2">
              ANTIGRAVITY
              <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono">
                ENTERPRISE SOC
              </span>
            </span>
            <span className="text-xs text-zinc-400">
              Autonomous AI Incident Response & Cyber Security Platform
            </span>
          </div>
        </div>

        {/* Middle: Value Prop & Trust Feature Highlights */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>AI-Driven Threat Resolution Engine</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Accelerate Incident Response with{' '}
            <span className="text-gradient-ai">Enterprise Copilot Intelligence</span>
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed">
            Real-time multi-agent triage, deep knowledge base synthesis, and automated remediation
            workflows built for mission-critical security operations centers.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex items-center gap-2.5 p-3 rounded-lg bg-surface/70 border border-subtle text-xs text-zinc-300"
                >
                  <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-medium">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Customer Review & Copyright */}
        <div className="relative z-10 space-y-4 pt-8 border-t border-subtle/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-zinc-400 italic">
              &ldquo;Antigravity SOC reduced our mean time to resolve critical cyber alerts by 84%
              across 14 global security teams.&rdquo;
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>© 2026 Antigravity Security Inc. All rights reserved.</span>
            <Link to="/splash" className="hover:text-zinc-300 underline transition-colors">
              System Overview
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Outlet */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 bg-background relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-md space-y-6"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
