import React from 'react';

export interface CopilotTypingAnimationProps {
  label?: string;
}

/**
 * Smooth typing animation with blinking cursor for incremental token rendering.
 */
export const CopilotTypingAnimation: React.FC<CopilotTypingAnimationProps> = React.memo(
  ({ label = 'Copilot is analyzing...' }) => {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
        </div>
        <span>{label}</span>
      </div>
    );
  }
);

CopilotTypingAnimation.displayName = 'CopilotTypingAnimation';
