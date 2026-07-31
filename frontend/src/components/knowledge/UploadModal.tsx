import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { DocumentType } from '../../types/knowledge';
import toast from 'react-hot-toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<DocumentType>('MD');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setFileType('PDF');
      else if (ext === 'docx' || ext === 'doc') setFileType('DOCX');
      else if (ext === 'txt') setFileType('TXT');
      else setFileType('MD');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
      if (!title) {
        setTitle(dropped.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('file_type', fileType);
    if (file) {
      formData.append('file', file);
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(formData);
      toast.success('Document uploaded and indexing started');
      handleResetAndClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check file format.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetAndClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setError(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Upload Knowledge Document</h2>
              <p className="text-xs text-slate-400">
                Index security runbooks and policies for RAG AI citations
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag and Drop Box */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              file
                ? 'border-cyan-500/50 bg-cyan-500/5'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-cyan-400" />
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-200">{file.name}</div>
                  <div className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • Click or drop to change file
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="mx-auto h-10 w-10 text-slate-500" />
                <p className="mt-2 text-sm font-semibold text-slate-200">
                  Click to select file or drag and drop
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Supported formats: PDF, DOCX, Markdown (.md), Text (.txt)
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Enterprise Incident Response Runbook"
              className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description / Tags
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or context for search & retrieval..."
              className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* File Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              File Format
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {(['MD', 'TXT', 'PDF', 'DOCX'] as DocumentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFileType(type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                    fileType === type
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={handleResetAndClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload & Index
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
