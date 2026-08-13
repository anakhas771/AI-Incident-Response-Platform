import React from 'react';
import {
  FileText,
  FileCode,
  File,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
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
        return <FileCode className="h-5 w-5 text-cyan-400" />;
      case 'PDF':
        return <FileText className="h-5 w-5 text-rose-400" />;
      case 'DOCX':
        return <File className="h-5 w-5 text-blue-400" />;
      default:
        return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'INDEXED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Indexed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
            <Clock className="h-3 w-3" />
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
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-500/5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/80">
              {getFileIcon()}
            </div>
            <div>
              <h3
                onClick={() => onView(document)}
                className="cursor-pointer text-sm font-bold text-slate-200 transition-colors hover:text-cyan-400 line-clamp-1"
              >
                {document.title}
              </h3>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                {document.file_type} DOCUMENT
              </span>
            </div>
          </div>

          {getStatusBadge()}
        </div>

        {document.description && (
          <p className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-2">
            {document.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-center text-xs">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Pages</div>
            <div className="mt-0.5 font-bold text-slate-200">{document.page_count}</div>
          </div>
          <div className="border-x border-slate-800/80">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Words</div>
            <div className="mt-0.5 font-bold text-slate-200">
              {document.word_count.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Chunks</div>
            <div className="mt-0.5 font-bold text-cyan-400">{document.chunk_count}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-500" />
            {document.uploaded_by_name || 'System'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-500" />
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {document.status === 'FAILED' && onRetry ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(document.id)}
              className="h-7 w-7 p-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
              title="Retry processing"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          ) : onReindex ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReindex(document.id)}
              className="h-7 w-7 p-0"
              title="Re-index document"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document)}
            className="h-7 px-2.5 text-xs"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => onDelete(document.id)}
            className="h-7 w-7 p-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
            title="Delete document"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
