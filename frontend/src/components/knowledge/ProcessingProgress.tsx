import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, FileText, Cpu, Database } from 'lucide-react';
import { DocumentStatus } from '../../types/knowledge';

interface ProcessingProgressProps {
  status: DocumentStatus;
  pageCount?: number;
  wordCount?: number;
  chunkCount?: number;
  embeddingCount?: number;
  errorMessage?: string;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  status,
  pageCount = 0,
  wordCount = 0,
  chunkCount = 0,
  embeddingCount = 0,
  errorMessage,
}) => {
  const steps = [
    { key: 'UPLOADED', label: 'File Uploaded', icon: FileText },
    { key: 'PROCESSING', label: 'Parsing & Chunking', icon: Cpu },
    { key: 'INDEXED', label: 'Vector Indexed', icon: Database },
  ];

  const getStepStatus = (stepKey: string) => {
    if (status === 'FAILED') {
      return stepKey === 'PROCESSING' ? 'error' : stepKey === 'UPLOADED' ? 'completed' : 'pending';
    }
    if (status === 'INDEXED') return 'completed';
    if (status === 'PROCESSING') {
      if (stepKey === 'UPLOADED') return 'completed';
      if (stepKey === 'PROCESSING') return 'active';
      return 'pending';
    }
    if (status === 'UPLOADED') {
      if (stepKey === 'UPLOADED') return 'active';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const stepStatus = getStepStatus(step.key);
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                    stepStatus === 'completed'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : stepStatus === 'active'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 animate-pulse'
                      : stepStatus === 'error'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                      : 'border-slate-700 bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {stepStatus === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : stepStatus === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : stepStatus === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    stepStatus === 'completed'
                      ? 'text-emerald-300'
                      : stepStatus === 'active'
                      ? 'text-cyan-300'
                      : stepStatus === 'error'
                      ? 'text-rose-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    status === 'INDEXED'
                      ? 'bg-emerald-500/50'
                      : idx === 0 && status === 'PROCESSING'
                      ? 'bg-cyan-500/50'
                      : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {status === 'INDEXED' && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-slate-200">{pageCount}</strong> {pageCount === 1 ? 'page' : 'pages'}
            </span>
            <span>
              <strong className="text-slate-200">{wordCount.toLocaleString()}</strong> words
            </span>
            <span>
              <strong className="text-cyan-400">{chunkCount}</strong> chunks
            </span>
            <span>
              <strong className="text-emerald-400">{embeddingCount}</strong> embeddings
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-emerald-400">
            Ready for RAG
          </span>
        </div>
      )}

      {status === 'FAILED' && errorMessage && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          <strong>Processing Failed:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
};
