import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { KnowledgeDocument } from '../types/knowledge';
import { getKnowledgeDocumentDetail, deleteKnowledgeDocument } from '../services/knowledgeApi';
import { DocumentViewer } from '../components/knowledge/DocumentViewer';

export const KnowledgeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<KnowledgeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      setIsLoading(true);
      try {
        const doc = await getKnowledgeDocumentDetail(id);
        setDocument(doc);
      } catch {
        toast.error('Document not found');
        navigate('/knowledge');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [id, navigate]);

  const handleDelete = async (docId: string) => {
    try {
      await deleteKnowledgeDocument(docId);
      toast.success('Document deleted');
      navigate('/knowledge');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
        <p className="mt-3 text-sm text-slate-400">Loading document detail...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="py-24 text-center text-slate-400">
        <BookOpen className="mx-auto h-12 w-12 text-slate-600" />
        <p className="mt-4">Document not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/knowledge')} className="mt-4">
          Back to Knowledge Base
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/knowledge')}
          className="text-xs"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Knowledge Base
        </Button>
      </div>

      <DocumentViewer
        document={document}
        isOpen={true}
        onClose={() => navigate('/knowledge')}
        onDelete={handleDelete}
      />
    </div>
  );
};
