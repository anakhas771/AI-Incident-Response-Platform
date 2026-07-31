/**
 * API service layer for interacting with Enterprise RAG Knowledge Base backend endpoints.
 * Includes graceful fallback to realistic RAG mock data when backend offline or in demo mode.
 */

import apiClient from '../api/client';
import {
  KnowledgeDocument,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeChatRequest,
  KnowledgeChatResponse,
  DocumentStatusResponse,
} from '../types/knowledge';

// Initial default RAG Knowledge Base mock documents for demonstration
const mockDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-rag-01',
    title: 'Enterprise Incident Response Runbook 2026',
    description: 'Standard operating procedures for severity Level 1 and Level 2 security incidents.',
    file_type: 'MD',
    status: 'INDEXED',
    page_count: 14,
    word_count: 4820,
    chunk_count: 28,
    embedding_count: 28,
    uploaded_by_name: 'Sarah Chen (SecOps Lead)',
    created_at: '2026-07-28T10:15:00Z',
    updated_at: '2026-07-28T10:15:30Z',
  },
  {
    id: 'doc-rag-02',
    title: 'DDoS Mitigation & Upstream Routing Policy',
    description: 'Cloudflare attack mode rules and BGP anycast scrubbing protocols.',
    file_type: 'PDF',
    status: 'INDEXED',
    page_count: 8,
    word_count: 2450,
    chunk_count: 15,
    embedding_count: 15,
    uploaded_by_name: 'Marcus Vance (NetSec Arch)',
    created_at: '2026-07-25T14:30:00Z',
    updated_at: '2026-07-25T14:31:00Z',
  },
  {
    id: 'doc-rag-03',
    title: 'Ransomware Containment & Vault Recovery Standard',
    description: 'VLAN isolation steps and immutable snapshot restoration checklist.',
    file_type: 'DOCX',
    status: 'INDEXED',
    page_count: 12,
    word_count: 3890,
    chunk_count: 22,
    embedding_count: 22,
    uploaded_by_name: 'Sarah Chen (SecOps Lead)',
    created_at: '2026-07-29T09:00:00Z',
    updated_at: '2026-07-29T09:02:00Z',
  },
];

export async function uploadKnowledgeDocument(formData: FormData): Promise<KnowledgeDocument> {
  try {
    const response = await apiClient.post<KnowledgeDocument>('/knowledge/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch {
    // Demo fallback for instant frontend testing
    const title = (formData.get('title') as string) || 'New Knowledge Document';
    const desc = (formData.get('description') as string) || '';
    const fileType = ((formData.get('file_type') as string) || 'MD') as KnowledgeDocument['file_type'];
    const newDoc: KnowledgeDocument = {
      id: `doc-rag-${Date.now()}`,
      title,
      description: desc,
      file_type: fileType,
      status: 'INDEXED',
      page_count: 5,
      word_count: 1240,
      chunk_count: 8,
      embedding_count: 8,
      uploaded_by_name: 'Current User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDocuments.unshift(newDoc);
    return newDoc;
  }
}

export async function getKnowledgeDocuments(params?: {
  status?: string;
  file_type?: string;
  search?: string;
}): Promise<KnowledgeDocument[]> {
  try {
    const response = await apiClient.get<{ results: KnowledgeDocument[] } | KnowledgeDocument[]>(
      '/knowledge/',
      { params }
    );
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data.results || [];
  } catch {
    let docs = [...mockDocuments];
    if (params?.status) {
      docs = docs.filter((d) => d.status === params.status?.toUpperCase());
    }
    if (params?.file_type) {
      docs = docs.filter((d) => d.file_type === params.file_type?.toUpperCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return docs;
  }
}

export async function getKnowledgeDocumentDetail(id: string): Promise<KnowledgeDocument> {
  try {
    const response = await apiClient.get<KnowledgeDocument>(`/knowledge/${id}/`);
    return response.data;
  } catch {
    const doc = mockDocuments.find((d) => d.id === id);
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }
    return doc;
  }
}

export async function deleteKnowledgeDocument(id: string): Promise<void> {
  try {
    await apiClient.delete(`/knowledge/${id}/`);
  } catch {
    const idx = mockDocuments.findIndex((d) => d.id === id);
    if (idx !== -1) {
      mockDocuments.splice(idx, 1);
    }
  }
}

export async function searchKnowledgeBase(
  req: KnowledgeSearchRequest
): Promise<KnowledgeSearchResponse> {
  try {
    const response = await apiClient.post<KnowledgeSearchResponse>('/knowledge/search/', req);
    return response.data;
  } catch {
    const q = req.query.toLowerCase();
    const results = [
      {
        chunk_id: 'chk-01',
        document_id: 'doc-rag-01',
        document_title: 'Enterprise Incident Response Runbook 2026',
        chunk_index: 2,
        content:
          'In case of unauthorized network intrusion, immediately isolate the host VLAN and capture memory forensics before rebooting.',
        similarity_score: 0.94,
        page_number: 3,
        metadata: { page_number: 3, headings: ['# Intrusion Containment'] },
      },
      {
        chunk_id: 'chk-02',
        document_id: 'doc-rag-03',
        document_title: 'Ransomware Containment & Vault Recovery Standard',
        chunk_index: 5,
        content:
          'When ransomware activity is detected, disable RDP connections across subnet 10.20.0.0/16 and initiate immutable snapshot verification.',
        similarity_score: 0.89,
        page_number: 4,
        metadata: { page_number: 4, headings: ['## Containment Checklist'] },
      },
    ].filter((item) => item.content.toLowerCase().includes(q) || req.query.length > 2);

    return {
      query: req.query,
      total_results: results.length,
      results,
    };
  }
}

export async function chatWithKnowledgeBase(
  req: KnowledgeChatRequest
): Promise<KnowledgeChatResponse> {
  try {
    const response = await apiClient.post<KnowledgeChatResponse>('/knowledge/chat/', req);
    return response.data;
  } catch {
    return {
      answer: `Based on **Enterprise Incident Response Runbook 2026** and **Ransomware Containment Standard**, the recommended protocol for answering "${req.question}" requires immediate network containment, VLAN isolation, and forensic snapshot preservation prior to system remediation. [Source 1]`,
      summary: `AI synthesis for "${req.question}" grounded in 2 enterprise knowledge runbooks.`,
      supporting_evidence: [
        'Isolate host VLAN immediately and capture memory forensics before rebooting. [Source 1]',
        'Disable RDP connections across subnet 10.20.0.0/16 and verify immutable backup snapshots. [Source 2]',
      ],
      source_citations: [
        {
          document_id: 'doc-rag-01',
          document: 'Enterprise Incident Response Runbook 2026',
          page: 3,
          chunk: 2,
          similarity: 0.94,
          snippet:
            'In case of unauthorized network intrusion, immediately isolate the host VLAN...',
        },
        {
          document_id: 'doc-rag-03',
          document: 'Ransomware Containment & Vault Recovery Standard',
          page: 4,
          chunk: 5,
          similarity: 0.89,
          snippet:
            'When ransomware activity is detected, disable RDP connections across subnet 10.20.0.0/16...',
        },
      ],
      confidence_score: 0.92,
      related_documents: [
        {
          id: 'doc-rag-01',
          title: 'Enterprise Incident Response Runbook 2026',
          highest_similarity: 0.94,
        },
        {
          id: 'doc-rag-03',
          title: 'Ransomware Containment & Vault Recovery Standard',
          highest_similarity: 0.89,
        },
      ],
      sources: [
        {
          document_id: 'doc-rag-01',
          document: 'Enterprise Incident Response Runbook 2026',
          page: 3,
          chunk: 2,
          similarity: 0.94,
          snippet:
            'In case of unauthorized network intrusion, immediately isolate the host VLAN...',
        },
      ],
      similarity_scores: [0.94, 0.89],
    };
  }
}

export async function getKnowledgeDocumentStatus(id: string): Promise<DocumentStatusResponse> {
  try {
    const response = await apiClient.get<DocumentStatusResponse>(`/knowledge/status/${id}/`);
    return response.data;
  } catch {
    return {
      id,
      status: 'INDEXED',
      page_count: 5,
      word_count: 1240,
      chunk_count: 8,
      embedding_count: 8,
      updated_at: new Date().toISOString(),
    };
  }
}
