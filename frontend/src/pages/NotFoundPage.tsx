import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 text-zinc-100 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-mono font-bold tracking-tight text-white">404</h1>
          <h2 className="text-lg font-semibold text-zinc-200">Security Telemetry Node Not Found</h2>
          <p className="text-xs text-zinc-400">
            The requested platform route or security resource does not exist or has been archived.
          </p>
        </div>
        <Link to="/">
          <Button variant="ai" size="md">
            <Home className="w-4 h-4" /> Return to Command Center
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
