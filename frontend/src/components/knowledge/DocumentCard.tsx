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
        return <FileCode className="h-5 w-5 text-slate-300" />;
      case 'PDF':
        return <FileText className="h-5 w-5 text-slate-300" />;
      case 'DOCX':
        return <File className="h-5 w-5 text-slate-300" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatus = () => {
    switch (document.status) {
      case 'INDEXED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Indexed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
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
    <article className="group flex h-full flex-col justify-between border-b border-slate-800/90 py-5 transition-colors first:pt-0 last:border-b-0 last:pb-0">
      <div>
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => onView(document)}
            className="flex min-w-0 items-start gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 transition-colors group-hover:border-slate-700">
              {getFileIcon()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-white">
                {document.title}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-slate-600">
                {document.file_type} · {document.page_count} pages
              </span>
            </span>
          </button>

          <div className="shrink-0 pt-1">{getStatus()}</div>
        </div>

        {document.description && (
          <p className="mt-3 max-w-3xl line-clamp-2 text-xs leading-5 text-slate-400">
            {document.description}
          </p>
        )}

        <div className="mt-4 grid max-w-xl grid-cols-3 divide-x divide-slate-800 border-y border-slate-800/80 py-2.5">
          <div className="pr-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Words</div>
            <div className="mt-1 text-sm font-medium text-slate-200">
              {document.word_count.toLocaleString()}
            </div>
          </div>
          <div className="px-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Chunks</div>
            <div className="mt-1 text-sm font-medium text-slate-200">{document.chunk_count}</div>
          </div>
          <div className="pl-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Embeddings</div>
            <div className="mt-1 text-sm font-medium text-slate-200">
              {document.embedding_count}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-600" />
            {document.uploaded_by_name || 'System'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            {formattedDate}
          </span>
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
            variant="outline"
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
