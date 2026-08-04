import React from 'react';
import { Sparkles } from 'lucide-react';

export interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onSelectQuestion,
  disabled = false,
}) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Suggested follow-up questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectQuestion(question)}
            className="text-left px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/50 text-xs text-zinc-300 hover:text-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 group"
          >
            <span>{question}</span>
            <span className="text-indigo-400/60 group-hover:text-indigo-400 transition-colors">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
