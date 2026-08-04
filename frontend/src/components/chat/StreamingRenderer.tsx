import React from 'react';
import { motion } from 'framer-motion';

export interface StreamingRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const StreamingRenderer: React.FC<StreamingRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  return (
    <div className="relative inline-block w-full">
      <span className="whitespace-pre-wrap">{content}</span>
      {isStreaming && (
        <motion.span
          className="inline-block w-2 h-4 ml-1 bg-indigo-500 rounded-sm align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
