import React from 'react';
import { Sparkles } from 'lucide-react';

interface SimilarityCardProps {
  score: number; // 0.0 to 1.0
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SimilarityCard: React.FC<SimilarityCardProps> = ({
  score,
  label = 'Similarity Match',
  size = 'md',
}) => {
  const percentage = Math.round(score * 100);

  const getTheme = () => {
    if (percentage >= 90) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        barBg: 'bg-emerald-500',
        badge: 'High Match',
      };
    }
    if (percentage >= 75) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        barBg: 'bg-amber-500',
        badge: 'Good Match',
      };
    }
    return {
      bg: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
      barBg: 'bg-slate-500',
      badge: 'Related',
    };
  };

  const theme = getTheme();
  const sizeClass =
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border font-semibold backdrop-blur-sm ${theme.bg} ${sizeClass}`}
    >
      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      <span>{label}:</span>
      <span className="font-mono font-bold">{percentage}%</span>
      <span className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
        {theme.badge}
      </span>
    </div>
  );
};
