import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  MessageSquare,
  Database,
  Layers,
  Sparkles,
  FileText,
  RefreshCw,
  Send,
  Bot,
  User,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '../components/ui/EmptyState';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { DocumentCard } from '../components/knowledge/DocumentCard';
import { UploadModal } from '../components/knowledge/UploadModal';
import { SearchBar } from '../components/knowledge/SearchBar';
import { CitationPanel } from '../components/knowledge/CitationPanel';
import { SimilarityCard } from '../components/knowledge/SimilarityCard';
import { DocumentViewer } from '../components/knowledge/DocumentViewer';
import { KnowledgeDocument, KnowledgeSearchResponseItem, Citation } from '../types/knowledge';
import {
  getKnowledgeDocuments,
  uploadKnowledgeDocument,
  deleteKnowledgeDocument,
  searchKnowledgeBase,
  chatWithKnowledgeBase,
  getKnowledgeDocumentStatus,
  reindexKnowledgeDocument,
  retryKnowledgeDocument,
} from '../services/knowledgeApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  summary?: string;
  citations?: Citation[];
  confidence?: number;
  timestamp: string;
}

export const KnowledgeBasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'chat'>('documents');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { canManageKnowledge } = usePermissions();

  // Filter state for documents tab
  const [docFilterType, setDocFilterType] = useState<string>('ALL');
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');

  // Semantic search state
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResponseItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryText, setSearchQueryText] = useState('');

  // RAG Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'rag-msg-0',
      sender: 'ai',
      text: 'Welcome to the **Enterprise RAG Knowledge Base Copilot**. I am connected to your organization’s vector-indexed security runbooks, incident policies, and mitigation standards. Ask me anything about incident containment, subnet isolation, or recovery procedures.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatGenerating, setIsChatGenerating] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await getKnowledgeDocuments();
      setDocuments(docs);
    } catch (err) {
      toast.error('Failed to load knowledge documents');
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Aggregate stats across documents
  const totalDocs = documents.length;
  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);
  const totalEmbeddings = documents.reduce((acc, doc) => acc + (doc.embedding_count || 0), 0);
  const totalWords = documents.reduce((acc, doc) => acc + (doc.word_count || 0), 0);

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true);
    try {
      const newDoc = await uploadKnowledgeDocument(formData);
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success('Document uploaded and index pipeline initiated');
      setIsUploadModalOpen(false);

      // Simulate polling status completion for realistic UX
      setTimeout(async () => {
        try {
          const statusRes = await getKnowledgeDocumentStatus(newDoc.id);
          setDocuments((prev) =>
            prev.map((d) => (d.id === newDoc.id ? { ...d, ...statusRes } : d))
          );
        } catch {
          // ignore error
        }
      }, 2500);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKnowledgeDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Document deleted and vector embeddings purged');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await reindexKnowledgeDocument(id);
      toast.success(`Re-indexing task triggered for document ${id}`);
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'PROCESSING' } : d)));

      // Poll status
      setTimeout(async () => {
        try {
          const statusRes = await getKnowledgeDocumentStatus(id);
          setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...statusRes } : d)));
        } catch {
          // ignore
        }
      }, 3000);
    } catch {
      toast.error('Failed to trigger re-index');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryKnowledgeDocument(id);
      toast.success(`Retry task triggered for document ${id}`);
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'PROCESSING' } : d)));

      // Poll status
      setTimeout(async () => {
        try {
          const statusRes = await getKnowledgeDocumentStatus(id);
          setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...statusRes } : d)));
        } catch {
          // ignore
        }
      }, 3000);
    } catch {
      toast.error('Failed to trigger retry');
    }
  };

  const handleSearch = async (query: string, minSimilarity: number, topK: number) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchQueryText(query);
    try {
      const res = await searchKnowledgeBase({
        query,
        min_similarity: minSimilarity,
        top_k: topK,
      });
      setSearchResults(res.results || []);
    } catch {
      toast.error('Vector similarity search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatGenerating) return;

    const userText = chatInput.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatGenerating(true);

    try {
      const ragRes = await chatWithKnowledgeBase({ question: userText });
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: ragRes.answer,
        summary: ragRes.summary,
        citations: ragRes.source_citations,
        confidence: ragRes.confidence_score,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      toast.error('RAG chat generation failed');
    } finally {
      setIsChatGenerating(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesType = docFilterType === 'ALL' || doc.file_type === docFilterType;
    const matchesQuery =
      !docSearchQuery ||
      doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(docSearchQuery.toLowerCase()));
    return matchesType && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              Phase 6 Enterprise RAG
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-100 sm:text-3xl">
            Enterprise Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Vector-indexed security policies, runbooks, and historical incident intelligence for AI
            grounding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoadingDocs}
            className="text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManageKnowledge && (
            <Button
              variant="default"
              size="sm"
              disabled={isUploading}
              onClick={() => setIsUploadModalOpen(true)}
              className="shrink-0"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          )}
        </div>
      </div>

      {/* RAG Analytics Banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Indexed Documents</span>
            <BookOpen className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{totalDocs}</div>
          <div className="mt-1 text-xs text-slate-500">
            {totalWords.toLocaleString()} total words
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Vector Chunks</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400">{totalChunks}</div>
          <div className="mt-1 text-xs text-slate-500">Avg 500 characters / chunk</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>pgvector Embeddings</span>
            <Database className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{totalEmbeddings}</div>
          <div className="mt-1 text-xs text-slate-500">1536-dimensional HNSW index</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>AI Citation Grounding</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400">Active</div>
          <div className="mt-1 text-xs text-slate-500">Zero-hallucination guardrails</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-all ${
            activeTab === 'documents'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Documents ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-all ${
            activeTab === 'search'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Semantic Vector Search</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-bold transition-all ${
            activeTab === 'chat'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>RAG AI Copilot Chat</span>
        </button>
      </div>

      {/* Tab 1: Documents Management */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'MD', 'PDF', 'DOCX', 'TXT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocFilterType(type)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    docFilterType === type
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type === 'ALL' ? 'All Formats' : `${type} Files`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Filter documents by title..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Document Grid */}
          {isLoadingDocs ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-slate-400">Loading enterprise knowledge base...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No documents found"
              description={
                docSearchQuery || docFilterType !== 'ALL'
                  ? 'Try adjusting your format or title filter.'
                  : 'Get started by uploading your organization’s standard security runbooks and policies.'
              }
              action={
                !docSearchQuery && docFilterType === 'ALL' && canManageKnowledge ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-2"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Knowledge Document
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onView={(d) => {
                    setSelectedDoc(d);
                    setIsViewerOpen(true);
                  }}
                  onDelete={handleDelete}
                  onReindex={handleReindex}
                  onRetry={handleRetry}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Semantic Vector Search */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-base font-bold text-slate-100">
              Semantic Vector Similarity Search
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Uses cosine similarity over 1536-dimensional embeddings to retrieve contextually
              relevant chunks
            </p>
            <div className="mt-4">
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                initialQuery={searchQueryText}
              />
            </div>
          </div>

          {searchQueryText && (
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200">
                Search Results for &ldquo;{searchQueryText}&rdquo; ({searchResults.length})
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Metric: Cosine Similarity (&lt;=&gt;)
              </span>
            </div>
          )}

          {isSearching ? (
            <div className="py-16 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-3 text-sm text-slate-400">
                Computing vector distances across pgvector store...
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            searchQueryText ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <Search className="mx-auto h-10 w-10 text-slate-600" />
                <h4 className="mt-3 text-sm font-bold text-slate-300">No matching chunks</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Try lowering the minimum similarity threshold or using broader terminology.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-cyan-400" />
                <h4 className="mt-3 text-sm font-bold text-slate-300">Ready for Semantic Search</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Enter a query above to test vector retrieval across your enterprise runbooks.
                </p>
              </div>
            )
          ) : (
            <div className="grid gap-4">
              {searchResults.map((item, idx) => (
                <div
                  key={`${item.chunk_id}-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 transition-all hover:border-cyan-500/50 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{item.document_title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <span>Page {item.page_number}</span>
                          <span>•</span>
                          <span>Chunk #{item.chunk_index}</span>
                        </div>
                      </div>
                    </div>

                    <SimilarityCard score={item.similarity_score} />
                  </div>

                  <p className="mt-3 rounded-lg border border-slate-800/80 bg-slate-950/70 p-3.5 font-mono text-xs leading-relaxed text-slate-300">
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: RAG AI Copilot Chat */}
      {activeTab === 'chat' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Transcript Area */}
          <div className="flex h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">RAG AI Security Copilot</h3>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    ● Grounded in Enterprise Vector Knowledge Base
                  </span>
                </div>
              </div>

              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                Strict Citation Mode
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-medium'
                        : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Show confidence & citations if AI */}
                    {msg.sender === 'ai' && msg.confidence && (
                      <div className="mt-4 border-t border-slate-800/80 pt-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            RAG Grounding Confidence
                          </span>
                          <SimilarityCard score={msg.confidence} label="Confidence" size="sm" />
                        </div>

                        {msg.citations && msg.citations.length > 0 && (
                          <CitationPanel citations={msg.citations} />
                        )}
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isChatGenerating && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
                    Retrieving vector chunks and grounding response...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-slate-800 bg-slate-900/90 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about security policies, runbooks, or containment checklists..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="default"
                  disabled={!chatInput.trim() || isChatGenerating}
                  className="h-9 px-4 text-xs font-bold"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>

          {/* RAG Context / Live Grounding Sidebar */}
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">How RAG Grounding Works</h3>
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              When you ask a question, the platform converts your prompt into a 1536-dimensional
              vector and queries the enterprise vector index using cosine similarity.
            </p>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[11px]">
                    1
                  </span>
                  <span>Vector Embedding Generation</span>
                </div>
                <p className="mt-1 pl-7 text-xs text-slate-400">
                  User query transformed via <code>text-embedding-ada-002</code> compatible encoder.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px]">
                    2
                  </span>
                  <span>pgvector Cosine Search</span>
                </div>
                <p className="mt-1 pl-7 text-xs text-slate-400">
                  Retrieves top-k chunks with similarity score &gt; 70% threshold.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-[11px]">
                    3
                  </span>
                  <span>Grounded AI Synthesis</span>
                </div>
                <p className="mt-1 pl-7 text-xs text-slate-400">
                  LLM prompt enriched with exact citations and page numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* Document Detail / Chunk Viewer Modal */}
      <DocumentViewer
        document={selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDelete={handleDelete}
        onReindex={handleReindex}
      />
    </div>
  );
};
