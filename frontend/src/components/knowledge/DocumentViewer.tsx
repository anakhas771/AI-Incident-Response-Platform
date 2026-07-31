import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCode,
  File,
  Layers,
  Search,
  Database,
  Calendar,
  User,
} from 'lucide-react';
import { KnowledgeDocument } from '../../types/knowledge';
import { Button } from '../ui/Button';

interface DocumentViewerProps {
  document: KnowledgeDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onReindex?: (id: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onDelete,
  onReindex,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chunks' | 'metadata'>('chunks');

  if (!isOpen || !document) return null;

  const getFileIcon = () => {
    switch (document.file_type) {
      case 'MD':
      case 'TXT':
        return <FileCode className="h-6 w-6 text-cyan-400" />;
      case 'PDF':
        return <FileText className="h-6 w-6 text-rose-400" />;
      case 'DOCX':
        return <File className="h-6 w-6 text-blue-400" />;
      default:
        return <FileText className="h-6 w-6 text-slate-400" />;
    }
  };

  // Realistic mock chunks for previewing document structure
  const sampleChunks = Array.from({ length: Math.min(document.chunk_count || 5, 12) }, (_, i) => ({
    index: i + 1,
    page: Math.floor(i / 3) + 1,
    tokens: 180 + ((i * 17) % 40),
    content:
      i === 0
        ? `# ${document.title}\n\nStandard procedure and automated security workflows for enterprise incident mitigation across multi-tenant environments.`
        : i === 1
        ? `## Section ${i + 1}: Containment Protocols\nImmediate VLAN isolation and BGP traffic scrubbing must be triggered within 5 minutes of high-severity alert verification.`
        : `## Section ${i + 1}: Operational Guidelines\nEnsure memory dump and forensic snapshot retention before executing remediation scripts. Record all audit trails in PostgreSQL.`,
  })).filter(
    (chunk) =>
      !searchTerm ||
      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `section ${chunk.index}`.includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80">
              {getFileIcon()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{document.title}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-mono uppercase text-cyan-400">{document.file_type}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {document.uploaded_by_name || 'System'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{' '}
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReindex && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReindex(document.id)}
                className="text-xs"
              >
                Re-index
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete(document.id);
                  onClose();
                }}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs"
              >
                Delete
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 px-6 py-3 text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Pages</div>
            <div className="text-sm font-bold text-slate-200">{document.page_count}</div>
          </div>
          <div className="border-l border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Words</div>
            <div className="text-sm font-bold text-slate-200">
              {document.word_count.toLocaleString()}
            </div>
          </div>
          <div className="border-l border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Indexed Chunks</div>
            <div className="text-sm font-bold text-cyan-400">{document.chunk_count}</div>
          </div>
          <div className="border-l border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Embeddings (pgvector)</div>
            <div className="text-sm font-bold text-emerald-400">{document.embedding_count}</div>
          </div>
        </div>

        {/* Navigation tabs & Search inside doc */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('chunks')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'chunks'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Vector Chunks ({document.chunk_count})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'metadata'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Document Metadata</span>
            </button>
          </div>

          {activeTab === 'chunks' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter chunks..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'chunks' ? (
            <div className="space-y-3">
              {sampleChunks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No chunks match your filter term.
                </div>
              ) : (
                sampleChunks.map((chunk) => (
                  <div
                    key={chunk.index}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 text-xs">
                      <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
                        <span>Chunk #{chunk.index}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">Page {chunk.page}</span>
                      </div>
                      <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                        ~{chunk.tokens} tokens
                      </span>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
                      {chunk.content}
                    </pre>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Document Description
                </h4>
                <p className="mt-1 text-sm text-slate-300">
                  {document.description || 'No description provided.'}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Vector Engine Configuration
                </h4>
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="text-slate-500">Embedding Model</div>
                    <div className="mt-1 font-bold text-cyan-400">text-embedding-ada-002</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="text-slate-500">Vector Dimension</div>
                    <div className="mt-1 font-bold text-emerald-400">1536-dim (pgvector)</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="text-slate-500">Chunk Size / Overlap</div>
                    <div className="mt-1 font-bold text-slate-200">500 chars / 50 overlap</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="text-slate-500">Similarity Distance Metric</div>
                    <div className="mt-1 font-bold text-slate-200">Cosine Distance (&lt;=&gt;)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-3 text-xs text-slate-400">
          <span>Document ID: {document.id}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
};
