import React from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  File,
  FileCode,
  FileText,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import { KnowledgeDocument } from '../../types/knowledge';
import { Button } from '../ui/Button';

interface DocumentCardProps {
  document: KnowledgeDocument;
  onView: (doc: KnowledgeDocument) => void;
  onDelete: (id: string) => void;
  onReindex?: (id: string) => void;
  onRetry?: (id: string) => void;
  isDeleting?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
  onReindex,
  onRetry,
  isDeleting = false,
}) => {
  const getFileIcon = () => {
    switch (document.file_type) {
      case 'MD':
      case 'TXT':
        return <FileCode className="h-6 w-6 text-cyan-300" />;
      case 'PDF':
        return <FileText className="h-6 w-6 text-rose-300" />;
      case 'DOCX':
        return <File className="h-6 w-6 text-blue-300" />;
      default:
        return <FileText className="h-6 w-6 text-slate-300" />;
    }
  };

  const getStatus = () => {
    switch (document.status) {
      case 'INDEXED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Indexed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold text-rose-300">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            Uploaded
          </span>
        );
    }
  };

  const formattedDate = new Date(document.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="group flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,12,18,0.96))] shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/30 hover:shadow-cyan-950/20">
      <div className="relative overflow-hidden border-b border-slate-800/80 px-5 pb-4 pt-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-70" />
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => onView(document)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] shadow-inner">
              {getFileIcon()}
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {document.file_type} document
              </span>
              <span className="mt-1 block line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-100 group-hover:text-white">
                {document.title}
              </span>
            </span>
          </button>
          <div className="shrink-0">{getStatus()}</div>
        </div>

        {document.description ? (
          <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-400">
            {document.description}
          </p>
        ) : (
          <p className="mt-4 text-xs leading-5 text-slate-600">No description provided.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium text-slate-500">
          <span className="rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1">
            {document.page_count || 0} pages
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1">
            {document.word_count.toLocaleString()} words
          </span>
          <span className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.06] px-2.5 py-1 text-cyan-300">
            {document.chunk_count} chunks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-800/70">
        <div className="bg-slate-950/45 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Embeddings</div>
          <div className="mt-1 text-sm font-semibold text-emerald-300">
            {document.embedding_count.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-950/45 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Indexed</div>
          <div className="mt-1 text-sm font-semibold text-slate-200">
            {document.status === 'INDEXED' ? 'Ready' : document.status.toLowerCase()}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-600" />
            <span className="truncate">{document.uploaded_by_name || 'Unknown uploader'}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formattedDate}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {document.status === 'FAILED' && onRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(document.id)}
              className="h-8 px-2.5 text-xs text-rose-300 hover:text-rose-200"
              title="Retry processing"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          ) : onReindex ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReindex(document.id)}
              className="h-8 px-2.5 text-xs"
              title="Re-index document"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reindex
            </Button>
          ) : null}
          <Button
            variant="default"
            size="sm"
            onClick={() => onView(document)}
            className="h-8 px-3 text-xs"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(document.id)}
            className="h-8 w-8 p-0 text-rose-300 hover:text-rose-200"
            title="Delete document"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
};
