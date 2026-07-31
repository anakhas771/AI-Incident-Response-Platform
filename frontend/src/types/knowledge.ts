/**
 * TypeScript definitions for Enterprise RAG Knowledge Base documents, chunks, search, and AI chat.
 */

export type DocumentType = "PDF" | "DOCX" | "TXT" | "MD";

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "INDEXED" | "FAILED";

export interface KnowledgeDocument {
  id: string;
  title: string;
  description?: string;
  file?: string;
  file_type: DocumentType;
  status: DocumentStatus;
  processing_error?: string;
  page_count: number;
  word_count: number;
  chunk_count: number;
  embedding_count: number;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  top_k?: number;
  document_id?: string;
  tags?: string[];
  min_similarity?: number;
}

export interface KnowledgeSearchResponseItem {
  chunk_id: string;
  document_id: string;
  document_title: string;
  chunk_index: number;
  content: string;
  similarity_score: number;
  page_number: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResponse {
  query: string;
  total_results: number;
  results: KnowledgeSearchResponseItem[];
}

export interface Citation {
  document_id: string;
  document: string;
  page: number;
  chunk: number;
  similarity: number;
  snippet: string;
}

export interface RelatedDocument {
  id: string;
  title: string;
  highest_similarity: number;
}

export interface KnowledgeChatRequest {
  question: string;
  document_id?: string;
  tags?: string[];
}

export interface KnowledgeChatResponse {
  answer: string;
  summary: string;
  supporting_evidence: string[];
  source_citations: Citation[];
  confidence_score: number;
  related_documents: RelatedDocument[];
  sources: Citation[];
  similarity_scores: number[];
}

export interface DocumentStatusResponse {
  id: string;
  status: DocumentStatus;
  processing_error?: string;
  page_count: number;
  word_count: number;
  chunk_count: number;
  embedding_count: number;
  updated_at: string;
}
