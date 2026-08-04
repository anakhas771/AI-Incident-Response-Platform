import React from 'react';
import { motion } from 'framer-motion';

export interface TypingAnimationProps {
  label?: string;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  label = 'AI Security Engine analyzing...',
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs font-mono shadow-inner w-fit">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((idx) => (
          <motion.span
            key={idx}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: idx * 0.2,
            }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
};
