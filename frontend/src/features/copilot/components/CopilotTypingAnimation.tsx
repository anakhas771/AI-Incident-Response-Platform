import React from 'react';
import { motion } from 'framer-motion';

export interface CopilotTypingAnimationProps {
  label?: string;
}

export const CopilotTypingAnimation: React.FC<CopilotTypingAnimationProps> = ({
  label = 'Analyzing your question...',
}) => {
  return (
    <div
      className="inline-flex items-center gap-2 text-xs text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1">
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.15,
          }}
        />
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.3,
          }}
        />
      </span>

      <span>{label}</span>
    </div>
  );
};

CopilotTypingAnimation.displayName = 'CopilotTypingAnimation';