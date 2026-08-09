import React, { useRef, useState } from 'react';
import { Download, FileCode, FileText, Image, Paperclip, UploadCloud } from 'lucide-react';
import { IncidentAttachment } from '../types';
import { User } from '../../../types';
import toast from 'react-hot-toast';

export interface AttachmentsPanelProps {
  attachments: IncidentAttachment[];
  currentUser: User | null;
  onUploadAttachment: (file: File, user: User) => Promise<void>;
}

export const AttachmentsPanel: React.FC<AttachmentsPanelProps> = React.memo(
  ({ attachments, currentUser, onUploadAttachment }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (files: FileList | null) => {
      if (!files || files.length === 0 || !currentUser) return;
      const file = files[0];
      setUploading(true);

      try {
        await onUploadAttachment(file, currentUser);
        toast.success(`Attachment '${file.name}' uploaded successfully`, {
          style: { background: '#18181b', color: '#f4f4f5', border: '1px solid #27272a' },
        });
      } catch (err) {
        toast.error('Failed to upload attachment');
        console.error(err);
      } finally {
        setUploading(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    };

    const getFileIcon = (type: string) => {
      switch (type) {
        case 'IMAGE':
          return <Image className="w-4 h-4 text-emerald-400" />;
        case 'LOG_DATA':
          return <FileCode className="w-4 h-4 text-amber-400" />;
        default:
          return <FileText className="w-4 h-4 text-indigo-400" />;
      }
    };

    return (
      <div className="bg-surface border border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Evidence & Forensic Attachments ({attachments.length})
            </h3>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Upload evidence attachment drag and drop area"
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-950/20'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-zinc-200">
            {uploading
              ? 'Processing forensic upload...'
              : 'Drag & drop log files, pcap dumps, or screenshots'}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            Supports .log, .json, .pcap, .png, .pdf up to 50MB
          </p>
        </div>

        {/* File Attachments Virtualized Container */}
        <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {attachments.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 font-mono italic">
              No evidence files attached to this incident.
            </div>
          ) : (
            attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-subtle hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    {getFileIcon(att.file_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{att.filename}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span>{att.file_size}</span>
                      <span>•</span>
                      <span>By {att.uploaded_by.full_name}</span>
                      <span>•</span>
                      <span>
                        {new Date(att.uploaded_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={att.file_url}
                  download={att.filename}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Download ${att.filename}`}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
);

AttachmentsPanel.displayName = 'AttachmentsPanel';
